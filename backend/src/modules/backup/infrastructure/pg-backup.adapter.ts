import { Injectable } from "@nestjs/common";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";
import { join } from "path";
import { promisify } from "util";
import { DataSource } from "typeorm";
import { BackupPort } from "../application/backup.port";
import { BackupJobOrmEntity } from "./backup-job.orm-entity";
const run = promisify(execFile);

@Injectable()
export class PgBackupAdapter implements BackupPort {
  constructor(private source: DataSource) {}
  async create(actorId: string) {
    const id = randomUUID(), dir = process.env.BACKUP_DIR || join(process.cwd(), "backups"), filePath = join(dir, `${id}.dump`), repo = this.source.getRepository(BackupJobOrmEntity);
    await mkdir(dir, { recursive: true });
    let job: BackupJobOrmEntity = await repo.save({ id, operation: "BACKUP", status: "PENDING", filePath, sourceBackupId: null, error: null, completedAt: null } as BackupJobOrmEntity);
    try {
      await run("pg_dump", ["--format=custom", "--no-owner", "--host", process.env.DB_HOST || "localhost", "--port", process.env.DB_PORT || "5432", "--username", process.env.DB_USER || "dgm_user", "--file", filePath, process.env.DB_NAME || "dgm_library"], { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "dgm_pass" } });
      job.status = "SUCCEEDED";
    } catch (error) { job.status = "FAILED"; job.error = (error as Error).message.slice(0, 1000); }
    job.completedAt = new Date(); await repo.save(job); await this.audit(actorId, "BACKUP_COMPLETED", job); return job;
  }
  list() { return this.source.getRepository(BackupJobOrmEntity).find({ order: { createdAt: "DESC" }, take: 100 }); }
  async restore(backupId: string, actorId: string) {
    const repo = this.source.getRepository(BackupJobOrmEntity), source = await repo.findOne({ where: { id: backupId, operation: "BACKUP", status: "SUCCEEDED" } });
    if (!source) throw new Error("Successful backup not found");
    const job: BackupJobOrmEntity = await repo.save({ id: randomUUID(), operation: "RESTORE", status: "PENDING", filePath: source.filePath, sourceBackupId: source.id, error: null, completedAt: null } as BackupJobOrmEntity);
    try {
      await run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--host", process.env.DB_HOST || "localhost", "--port", process.env.DB_PORT || "5432", "--username", process.env.DB_USER || "dgm_user", "--dbname", process.env.DB_NAME || "dgm_library", source.filePath], { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "dgm_pass" } });
      job.status = "SUCCEEDED";
    } catch (error) { job.status = "FAILED"; job.error = (error as Error).message.slice(0, 1000); }
    job.completedAt = new Date(); await repo.save(job); await this.audit(actorId, "RESTORE_COMPLETED", job); return job;
  }
  private async audit(actorId: string, action: string, job: BackupJobOrmEntity) {
    await this.source.query("INSERT INTO audit_logs(actor_id,action,aggregate_type,aggregate_id,reason,details) VALUES($1,$2,'Backup',$3,NULL,$4::jsonb)", [actorId, action, job.id, JSON.stringify({ status: job.status, sourceBackupId: job.sourceBackupId })]);
  }
}
