import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

export default class Session extends Model {
  static table = 'sessions';
  static associations = {
    transcripts: { type: 'has_many' as const, foreignKey: 'session_id' },
  };

  @field('patient_id') patientId!: string;
  @field('doctor_id') doctorId!: string;
  @field('status') status!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime?: Date;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relation
  @children('transcripts') transcripts!: any;
}
