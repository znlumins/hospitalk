import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { supabase } from '../supabase';

export async function syncWithSupabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      // Convert Unix epoch to PostgreSQL timestamp ISO string
      const lastSyncTimestamp = lastPulledAt 
        ? new Date(lastPulledAt).toISOString() 
        : new Date(0).toISOString();

      // 1. Fetch changes from Supabase since `lastPulledAt`
      const { data: transcripts, error: transcriptsError } = await supabase
        .from('transcripts')
        .select('*')
        .gt('updated_at', lastSyncTimestamp);

      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .gt('updated_at', lastSyncTimestamp);

      if (transcriptsError || sessionsError) {
        throw new Error('Failed to pull changes from Supabase');
      }

      // Map sessions date fields from Postgres ISO strings to WatermelonDB millisecond numbers
      const formattedSessions = (sessions || []).map((s: any) => ({
        id: s.id,
        patient_id: s.patient_id,
        doctor_id: s.doctor_id,
        status: s.status,
        start_time: s.start_time ? new Date(s.start_time).getTime() : Date.now(),
        end_time: s.end_time ? new Date(s.end_time).getTime() : null,
        created_at: s.created_at ? new Date(s.created_at).getTime() : Date.now(),
        updated_at: s.updated_at ? new Date(s.updated_at).getTime() : Date.now(),
      }));

      // Map transcripts date fields from Postgres ISO strings to WatermelonDB millisecond numbers
      const formattedTranscripts = (transcripts || []).map((t: any) => ({
        id: t.id,
        session_id: t.session_id,
        sender_type: t.sender_type,
        content: t.content,
        confidence_score: t.confidence_score,
        is_edited: t.is_edited,
        timestamp: t.timestamp ? new Date(t.timestamp).getTime() : Date.now(),
        created_at: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
        updated_at: t.updated_at ? new Date(t.updated_at).getTime() : Date.now(),
      }));

      // Format changes for WatermelonDB
      const changes = {
        sessions: { created: formattedSessions, updated: [], deleted: [] },
        transcripts: { created: formattedTranscripts, updated: [], deleted: [] },
      };

      return { changes, timestamp: Date.now() };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      // Push local changes to Supabase
      const pushOperations = [];
      const changesMap = changes as any;

      // 1. Handling Sessions (Created & Updated)
      const sessionChanges = changesMap['sessions'];
      if (sessionChanges) {
        if (sessionChanges.created.length > 0) {
          pushOperations.push(
            supabase.from('sessions').insert(sessionChanges.created.map((s: any) => ({
              id: s.id,
              patient_id: s.patient_id,
              doctor_id: s.doctor_id,
              status: s.status,
              start_time: s.start_time ? new Date(s.start_time).toISOString() : new Date().toISOString(),
              end_time: s.end_time ? new Date(s.end_time).toISOString() : null,
              created_at: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })))
          );
        }
        if (sessionChanges.updated.length > 0) {
          for (const s of sessionChanges.updated) {
            pushOperations.push(
              supabase.from('sessions').upsert({
                id: s.id,
                patient_id: s.patient_id,
                doctor_id: s.doctor_id,
                status: s.status,
                start_time: s.start_time ? new Date(s.start_time).toISOString() : new Date().toISOString(),
                end_time: s.end_time ? new Date(s.end_time).toISOString() : null,
                created_at: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
            );
          }
        }
      }

      // 2. Handling Transcripts (Created & Updated)
      const transcriptChanges = changesMap['transcripts'];
      if (transcriptChanges) {
        if (transcriptChanges.created.length > 0) {
          pushOperations.push(
            supabase.from('transcripts').insert(transcriptChanges.created.map((t: any) => ({
              id: t.id,
              session_id: t.session_id,
              sender_type: t.sender_type,
              content: t.content,
              confidence_score: t.confidence_score,
              timestamp: t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString(),
              is_edited: t.is_edited,
              created_at: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })))
          );
        }
        if (transcriptChanges.updated.length > 0) {
          for (const t of transcriptChanges.updated) {
            pushOperations.push(
              supabase.from('transcripts').upsert({
                id: t.id,
                session_id: t.session_id,
                sender_type: t.sender_type,
                content: t.content,
                confidence_score: t.confidence_score,
                timestamp: t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString(),
                is_edited: t.is_edited,
                created_at: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
            );
          }
        }
      }

      await Promise.all(pushOperations);
    },
    migrationsEnabledAtVersion: 1,
  });
}
