import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class Transcript extends Model {
  static table = 'transcripts';
  static associations = {
    sessions: { type: 'belongs_to' as const, key: 'session_id' },
  };

  @field('session_id') sessionId!: string;
  @field('sender_type') senderType!: string;
  @field('content') content!: string;
  @field('confidence_score') confidenceScore?: number;
  @field('is_edited') isEdited!: boolean;
  @date('timestamp') timestamp!: Date;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('sessions', 'session_id') session!: any;
}
