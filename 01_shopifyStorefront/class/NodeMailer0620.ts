/**
 * NodeMailer.ts
 *
 * name：NodeMailer
 * function：Node Mailer
 * updated: 2025/06/20
 **/

'use strict';

// モジュール
import nodemailer from "nodemailer";

// Node Mailer class
class NodeMailer {
  static logger: any; // logger
  static transporter: any; // transporter
  static mailOptions: any; // mailOptions

  constructor(logger: any, host: string, port: number, username: string, password: string) {
    try {
      // loggeer instance
      NodeMailer.logger = logger;
      // setting
      NodeMailer.transporter = nodemailer.createTransport({
        host: host,
        secure: true,
        port: port,
        auth: {
          user: username, // your email
          pass: password // the app password you generated, paste without spaces
        },
        tls: {
          ciphers: 'SSLv3'
        }
      });
      NodeMailer.logger.trace('mailer: constructed.');
    } catch (e: unknown) {
      NodeMailer.logger.error(e);
    }
  }

  // sendmail
  sendMail = async (to: string, from: string, subject: string, body: string): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        NodeMailer.logger.trace('mailer: sending mail...');
        // mail sending option
        const mailSendOptions = {
          from: from,
          to: to,
          subject: subject,
          text: body,
          html: '',
        }
        // send mail
        NodeMailer.transporter.sendMail(mailSendOptions);
        NodeMailer.logger.trace('mailer: sending mail finished');
        resolve('finished');

      } catch (e: unknown) {
        NodeMailer.logger.error(e);
        reject('error');
      }
    });
  }
}

// export module
export default NodeMailer;