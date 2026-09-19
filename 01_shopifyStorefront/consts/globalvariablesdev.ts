/**
 * globalvariablesdev.ts
 **
 * function：global variables
**/

/** my const */
export namespace myDevConst {
  export const APP_NAME: string = 'CompassLinqDev';
  export const LISTEN_PORT: number = 8082;
  export const DEFAULT_URL: string = 'https://ebisudo.f5.si';
  export const LOG_LEVEL: string = 'all';
}

/* mail */
export namespace myDevMail {
  export const MAIL_FROM: string = "dev@ebisu-do.jp";
  export const MAIL_MEMBER_TITLE: string = "【検証用】会員登録用URLのご送付";
  export const MAIL_PASS_TITLE: string = "【検証用】パスワード変更用URLのご送付";
}
