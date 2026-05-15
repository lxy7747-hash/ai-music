import { db } from '../db/connection.js';
import { cookieCryptoService } from './cookie-crypto.service.js';

export interface User {
  id: number;
  neteaseUid: string;
  nickname: string;
  avatarUrl?: string;
  cookie: string;
}

export interface UpsertUserInput {
  neteaseUid: string;
  nickname?: string;
  avatarUrl?: string;
  cookie: string;
}

interface UserRow {
  id: number;
  netease_uid: string;
  nickname: string;
  avatar_url: string | null;
  cookie: string;
}

class UserService {
  upsertUser(input: UpsertUserInput): User {
    db.prepare(
      `
      INSERT INTO users (netease_uid, nickname, avatar_url, cookie)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(netease_uid) DO UPDATE SET
        nickname = excluded.nickname,
        avatar_url = excluded.avatar_url,
        cookie = excluded.cookie
      `,
    ).run(
      input.neteaseUid,
      input.nickname ?? 'Netease User',
      input.avatarUrl ?? null,
      cookieCryptoService.encrypt(input.cookie),
    );

    const user = db.prepare('SELECT * FROM users WHERE netease_uid = ?').get(input.neteaseUid) as UserRow;
    return this.mapUser(user);
  }

  getCurrentUser(): User | null {
    const user = db
      .prepare(
        `
        SELECT *
        FROM users
        WHERE netease_uid <> 'system'
        ORDER BY id DESC
        LIMIT 1
        `,
      )
      .get() as UserRow | undefined;

    return user ? this.mapUser(user) : null;
  }

  clearUsers(): void {
    db.prepare("DELETE FROM users WHERE netease_uid <> 'system'").run();
  }

  private mapUser(row: UserRow): User {
    return {
      id: row.id,
      neteaseUid: row.netease_uid,
      nickname: row.nickname,
      avatarUrl: row.avatar_url ?? undefined,
      cookie: cookieCryptoService.decrypt(row.cookie),
    };
  }
}

export const userService = new UserService();
