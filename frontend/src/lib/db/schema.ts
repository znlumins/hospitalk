import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'sessions',
      columns: [
        { name: 'patient_id', type: 'string' },
        { name: 'doctor_id', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transcripts',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'sender_type', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'confidence_score', type: 'number', isOptional: true },
        { name: 'timestamp', type: 'number' },
        { name: 'is_edited', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
