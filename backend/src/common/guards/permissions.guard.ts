import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { DataSource } from "typeorm";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private source: DataSource) {}
  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest().user;
    if (!user?.role) return false;
    const rows = await this.source.query("SELECT permissions FROM role_definitions WHERE code=$1", [user.role]);
    const granted: string[] = rows[0]?.permissions ?? [];
    return granted.includes("*") || required.every(value => granted.includes(value));
  }
}
