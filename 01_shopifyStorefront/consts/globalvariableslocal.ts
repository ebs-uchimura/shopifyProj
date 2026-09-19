/**
 * globalvariableslocal.ts
 **
 * function：global variables
**/

/** my const */
export namespace myLocalDevConst {
  export const APP_NAME: string = 'CompassLinqLocal';
  export const LISTEN_PORT: number = 3000;
  export const DEV_PORT: number = 3001;
  export const DEFAULT_URL: string = 'https://localhost:' + myLocalDevConst.DEV_PORT;
  export const LOG_LEVEL: string = 'all';
}

/* mail */
export namespace myLocalDevMail {
  export const MAIL_FROM: string = "uchimura@ebisu-do.jp";
  export const MAIL_MEMBER_TITLE: string = "【ローカル検証用】会員登録用URLのご送付";
  export const MAIL_PASS_TITLE: string = "【ローカル検証用】パスワード変更用URLのご送付";
}
