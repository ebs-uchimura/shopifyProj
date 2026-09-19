/**
 * MySqlJoin.ts
 *
 * name：SQL
 * function：SQL with Join operation
 * updated: 2025/06/23
 **/

'use strict';

// import global interface
import { } from '../@types/globaljoinsql';

// define modules
import * as mysql from 'mysql2'; // mysql

// SQL class
class SQL {
  static logger: any; // logger
  static pool: any; // sql pool
  static encryptkey: string; // encryptkey

  // construnctor
  constructor(
    host: string,
    user: string,
    pass: string,
    port: number,
    db: string,
    logger: any,
    key?: string,
  ) {
    // loggeer instance
    SQL.logger = logger;
    // DB config
    SQL.pool = mysql.createPool({
      host: host, // host
      user: user, // username
      password: pass, // password
      database: db, // db name
      port: port, // port number
      waitForConnections: true, // wait for conn
      idleTimeout: 1000000, // timeout(ms)
      insecureAuth: false, // allow insecure
    });
    // encrypted key
    SQL.encryptkey = key!;
    SQL.logger.trace('db: constructed.');
  }

  // inquire
  doInquiry = async (sql: string, inserts: string[]): Promise<any> => {
    return new Promise(async (resolve, _) => {
      try {
        // make query
        const qry: any = mysql.format(sql, inserts);
        // connect ot mysql
        const promisePool: any = SQL.pool.promise();
        // query name
        const [rows, _] = await promisePool.query(qry);

        // empty
        if (SQL.isEmpty(rows)) {
          // return error
          resolve('empty');
        } else {
          // result object
          resolve(rows);
        }
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve('error');
      }
    });
  };

  // count db
  countDB = async (args: countargs): Promise<number> => {
    return new Promise(async (resolve) => {
      try {
        SQL.logger.trace('db: countDB mode');
        // total
        let total: number;
        // query string
        let queryString: string;
        // array
        let placeholder: any[];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[][] = args.values;
        // span (optional)
        const spanval: any = args.spanval ?? null;
        // spancol (optional)
        const spancol: any = args.spancol ?? null;
        // spandirection (optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit (optional)
        const spanunit: any = args.spanunit ?? null;
        // col length
        const colLen: number = columns.length;
        // value length
        const valLen: number = values.length;

        // query
        queryString = 'SELECT COUNT(*) FROM ??';
        // placeholder
        placeholder = [table];

        // if column not null
        if (colLen > 0 && valLen > 0) {
          // add where phrase
          queryString += ' WHERE';

          // loop for array
          for (let i: number = 0; i < colLen; i++) {
            // add in phrase
            queryString += ' ?? IN (?)';
            // push column
            placeholder.push(columns[i]);
            // push value
            placeholder.push(values[i]);

            // other than last one
            if (i < colLen - 1) {
              // add 'and' phrase
              queryString += ' AND';
            }
          }
        }

        // if column not null
        if (spanval && spancol && spanunit && spandirection) {
          // flg
          if (spandirection == 'after') {
            // query
            queryString += ` AND ?? > date(current_timestamp - interval ? ${spanunit})`;
          } else if (spandirection == 'before') {
            // query
            queryString += ` AND ?? < date(current_timestamp - interval ? ${spanunit})`;
          }
          // push span column
          placeholder.push(spancol);
          // push span limit
          placeholder.push(spanval);
        }

        // do query
        await this.doInquiry(queryString, placeholder)
          .then((result: any) => {
            // result exists
            if (result == 'error' || result == 'empty') {
              // initialize total
              total = 0;
            } else {
              // set total
              total = result[0]['COUNT(*)'];
            }
            SQL.logger.trace(`countDB: total is ${total}`);
            // return total
            resolve(total);
          })
          .catch((err: unknown) => {
            // error type
            SQL.logger.error(err);
            resolve(0);
          });
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve(0);
      }
    });
  };

  // count join db
  countJoinDB = async (args: countjoinargs): Promise<number> => {
    return new Promise(async (resolve) => {
      try {
        SQL.logger.trace('db: countjoinDB mode');
        // total
        let total: number;
        // query string
        let queryString: string;
        // array
        let placeholder: any[];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[][] = args.values;
        // jointable
        const jointable: string = args.jointable;
        // joincolumns
        const joincolumns: string[] = args.joincolumns;
        // joinvalues
        const joinvalues: any[][] = args.joinvalues;
        // joinid1
        const joinid1: string = args.joinid1;
        // joinid2
        const joinid2: string = args.joinid2;
        // spantable (optional)
        const spantable: any = args.spantable ?? null;
        // span (optional)
        const spanval: any = args.spanval ?? null;
        // spandirection (optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit (optional)
        const spanunit: any = args.spanunit ?? null;
        // col length
        const colLen: number = columns.length;
        // value length
        const valLen: number = values.length;

        // query
        queryString =
          'SELECT COUNT(??.id) FROM ?? INNER JOIN ?? ON ??.?? = ??.??';
        // placeholder
        placeholder = [
          table,
          table,
          jointable,
          table,
          joinid1,
          jointable,
          joinid2,
        ];

        // if column not null
        if (colLen > 0 && valLen > 0) {
          // add where phrase
          queryString += ' WHERE';

          // loop for array
          for (let i: number = 0; i < colLen; i++) {
            // add in phrase
            queryString += ' ??.?? IN (?)';
            // push table
            placeholder.push(table);
            // push column
            placeholder.push(columns[i]);
            // push value
            placeholder.push(values[i]);

            // other than last one
            if (i < colLen) {
              // add and phrase
              queryString += ' AND';
            }
          }

          // if joincolumn not null
          if (joincolumns.length > 0) {
            // loop for array
            for (let j: number = 0; j < joincolumns.length; j++) {
              // add in phrase
              queryString += ' ??.?? IN (?)';
              // push table
              placeholder.push(jointable);
              // push column
              placeholder.push(joincolumns[j]);
              // push value
              placeholder.push(joinvalues[j]);

              // other than last one
              if (j < joincolumns.length - 1) {
                // add and phrase
                queryString += ' AND';
              }
            }
          }
        }

        // if column not null
        if (spantable && spanval && spanunit && spandirection) {
          // flg
          if (spandirection == 'after') {
            // query
            queryString += ` AND ${spantable}.?? > date(current_timestamp - interval ? ${spanunit})`;
          } else if (spandirection == 'before') {
            // query
            queryString += ` AND ${spantable}.?? < date(current_timestamp - interval ? ${spanunit})`;
          }
          // push span column
          placeholder.push('created_at');
          // push span limit
          placeholder.push(spanval);
        }

        // do query
        await this.doInquiry(queryString, placeholder)
          .then((result: any) => {
            // result exists
            if (result == 'error' || result == 'empty') {
              // initialize total
              total = 0;
            } else {
              // set total
              total = result[0]['COUNT(`' + table + '`.id)'];
            }
            SQL.logger.trace(`countjoinDB: total is ${total}`);
            // return total
            resolve(total);
          })
          .catch((err: unknown) => {
            // error
            SQL.logger.error(err);
            resolve(0);
          });
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve(0);
      }
    });
  };

  // select db
  selectDB = async (args: selectargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        SQL.logger.trace('db: selectDB mode');
        // query string
        let queryString: string;
        // not
        let tmpQuery: string = '';
        // array
        let placeholder: any[];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[][] = args.values;
        // fields (optional)
        const fields: any = args.fields ?? null;
        // span (optional)
        const spanval: any = args.spanval ?? null;
        // spandirection (optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit (optional)
        const spanunit: any = args.spanunit ?? null;
        // reverse (optional)
        const reverse: any = args.reverse ?? false;
        // order (optional)
        const order: any = args.order ?? null;
        // limit (optional)
        const limit: any = args.limit ?? null;
        // order (optional)
        const offset: any = args.offset ?? null;
        // col length
        const colLen: number = columns.length;
        // value length
        const valLen: number = values.length;

        // if fields exists
        if (fields) {
          // query
          queryString = 'SELECT ?? FROM ??';
          // placeholder
          placeholder = [fields, table];
        } else {
          // query
          queryString = 'SELECT * FROM ??';
          // placeholder
          placeholder = [table];
        }

        // if column not null
        if (colLen > 0 && valLen > 0) {
          // add where phrase
          queryString += ' WHERE';

          // loop for array
          for (let i: number = 0; i < colLen; i++) {
            // make empty
            tmpQuery = '';
            // fuzzy search
            if (columns[i].includes('*')) {
              // replace asterisk
              tmpQuery = columns[i].replace('*', '');
              // value length
              const valueLength: number = values[i].length;
              // loop for array
              for (let j: number = 0; j < valueLength; j++) {
                // set query
                queryString += " ?? LIKE CONCAT('%', ?, '%')";
                // push column
                placeholder.push(tmpQuery);
                // push value
                placeholder.push(values[i][j]);
                // other than last one
                if (i < valueLength - 1) {
                  // add 'and' phrase
                  queryString += ' AND';
                }
              }

            } else {
              // add in phrase
              queryString += ' ?? IN (?)';
              // push column
              placeholder.push(columns[i]);
              // push value
              placeholder.push(values[i]);
            }

            // other than last one
            if (i < colLen - 1) {
              // add 'and' phrase
              queryString += ' AND';
            }
          }
        }

        // if column not null
        if (spanval && spandirection) {
          // flg
          if (spandirection == 'after') {
            // query
            queryString += ` AND ?? > date(current_timestamp - interval ? ${spanunit})`;
          } else if (spandirection == 'before') {
            // query
            queryString += ` AND ?? < date(current_timestamp - interval ? ${spanunit})`;
          }
          // push span column
          placeholder.push('created_at');
          // push span limit
          placeholder.push(spanval);
        }

        // query
        queryString += ' ORDER BY ??';

        // if reverse
        if (reverse) {
          // query
          queryString += ' ASC';
        } else {
          // query
          queryString += ' DESC';
        }

        // if order exists
        if (order) {
          // push order key
          placeholder.push(order);
        } else {
          // push default id
          placeholder.push('id');
        }

        // if limit exists
        if (limit) {
          // query
          queryString += ' LIMIT ?';
          // push limit
          placeholder.push(limit);
        }

        // if offset exists
        if (offset) {
          // query
          queryString += ' OFFSET ?';
          // push offset
          placeholder.push(offset);
        }

        // do query
        await this.doInquiry(queryString, placeholder)
          .then((result: any) => {
            // result exists
            if (result == 'error' || result == 'empty') {
              SQL.logger.trace(`selectDB: ${result}`);
            } else {
              SQL.logger.trace('selectDB: success');
            }
            // do query
            resolve(result);
          })
          .catch((err: unknown) => {
            // error
            SQL.logger.error(err);
            resolve('error');
          });
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve('error');
      }
    });
  };

  // select db with join
  selectJoinDB = async (args: joinargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        SQL.logger.trace('db: selectjoinDB mode');
        // query string
        let queryString: string;
        // placeholder
        let placeholder: any[];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[][] = args.values;
        // originalid
        const originid: string = args.originid;
        // jointable
        const jointable: string = args.jointable;
        // joincolumns
        const joincolumns: string[] = args.joincolumns;
        // joinvalues
        const joinvalues: any[] = args.joinvalues;
        // joinid
        const joinid: string = args.joinid;
        // limit (optional)
        const limit: any = args.limit ?? null;
        // order (optional)
        const offset: any = args.offset ?? null;
        // spantable (optional)
        const spantable: any = args.spantable ?? null;
        // span (optional)
        const spanval: any = args.spanval ?? null;
        // spandirection (optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit (optional)
        const spanunit: any = args.spanunit ?? null;
        // order (optional)
        const order: any = args.order ?? null;
        // ordertable (optional)
        const ordertable: any = args.ordertable ?? null;
        // reverse (optional)
        const reverse: any = args.reverse ?? false;
        // fields (optional)
        const fields: any = args.fields ?? null;
        // col length
        const colLen: number = columns.length;
        // joincol length
        const joincolLen: number = joincolumns.length;

        // if fields exists
        if (fields) {
          // query
          queryString = 'SELECT ?? FROM ?? INNER JOIN ?? ON ??.?? = ??.??';
          // placeholder
          placeholder = [
            fields,
            table,
            jointable,
            table,
            originid,
            jointable,
            joinid,
          ];
        } else {
          // query
          queryString = 'SELECT * FROM ?? INNER JOIN ?? ON ??.?? = ??.??';
          // placeholder
          placeholder = [table, jointable, table, originid, jointable, joinid];
        }

        // if column not null
        if (colLen > 0) {
          // add where phrase
          queryString += ' WHERE';

          // loop for array
          for (let i: number = 0; i < colLen; i++) {
            // add in phrase
            queryString += ' ??.?? IN (?)';
            // push table
            placeholder.push(table);
            // push column
            placeholder.push(columns[i]);
            // push value
            placeholder.push(values[i]);

            // other than last one
            if (i < colLen) {
              // add and phrase
              queryString += ' AND';
            }
          }

          // if joincolumn not null
          if (joincolLen > 0) {
            // loop for array
            for (let j: number = 0; j < joincolLen; j++) {
              // add in phrase
              queryString += ' ??.?? IN (?)';
              // push table
              placeholder.push(jointable);
              // push column
              placeholder.push(joincolumns[j]);
              // push value
              placeholder.push(joinvalues[j]);

              // other than last one
              if (j < joincolLen - 1) {
                // add and phrase
                queryString += ' AND';
              }
            }
          }

          // if column not null
          if (spanval && spantable && spanunit && spandirection) {
            // flg
            if (spandirection == 'after') {
              // query
              queryString += ` AND ${spantable}.?? > date(current_timestamp - interval ? ${spanunit})`;
            } else if (spandirection == 'before') {
              // query
              queryString += ` AND ${spantable}.?? < date(current_timestamp - interval ? ${spanunit})`;
            }
            // push span column
            placeholder.push('created_at');
            // push span limit
            placeholder.push(spanval);
          }

          // if order exists
          if (order) {
            // query
            queryString += ' ORDER BY ??.??';

            // if reverse
            if (reverse) {
              // query
              queryString += ' ASC';
            } else {
              // query
              queryString += ' DESC';
            }

            // if order exists
            if (ordertable) {
              // push ordertable
              placeholder.push(ordertable);
            } else {
              // push maintable
              placeholder.push(table);
            }
            // if order exists
            placeholder.push(order);
          }

          // if limit exists
          if (limit) {
            // query
            queryString += ' LIMIT ?';
            // push limit
            placeholder.push(limit);
          }

          // if offset exists
          if (offset) {
            // query
            queryString += ' OFFSET ?';
            // push offset
            placeholder.push(offset);
          }

          // do query
          await this.doInquiry(queryString, placeholder)
            .then((result: any) => {
              // result exists
              if (result == 'error' || result == 'empty') {
                SQL.logger.trace(`selectJoinDB: ${result}`);
              } else {
                SQL.logger.trace('selectJoinDB: success');
              }
              // do query
              resolve(result);
            })
            .catch((err: unknown) => {
              // error
              SQL.logger.error(err);
              resolve('error');
            });
        }
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve('error');
      }
    });
  };

  // select db with double join
  selectDoubleJoinDB = async (args: joindoubleargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        SQL.logger.trace('db: selectjoinDB mode');
        // query string
        let queryString: string;
        // placeholder
        let placeholder: any[];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[][] = args.values;
        // originid1
        const originid1: string = args.originid1;
        // originid2
        const originid2: string = args.originid2;
        // jointable1
        const jointable1: string = args.jointable1;
        // jointable2
        const jointable2: string = args.jointable2;
        // joincolumns1
        const joincolumns1: string[] = args.joincolumns1;
        // joincolumns2
        const joincolumns2: string[] = args.joincolumns2;
        // joinvalues1
        const joinvalues1: any[] = args.joinvalues1;
        // joinvalues2
        const joinvalues2: any[] = args.joinvalues2;
        // joinid1
        const joinid1: string = args.joinid1;
        // joinid2
        const joinid2: string = args.joinid2;
        // limit (optional)
        const limit: any = args.limit ?? null;
        // order (optional)
        const offset: any = args.offset ?? null;
        // spantable (optional)
        const spantable: any = args.spantable ?? null;
        // span (optional)
        const spanval: any = args.spanval ?? null;
        // spandirection (optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit (optional)
        const spanunit: any = args.spanunit ?? null;
        // order (optional)
        const order: any = args.order ?? null;
        // ordertable (optional)
        const ordertable: any = args.ordertable ?? null;
        // reverse (optional)
        const reverse: any = args.reverse ?? false;
        // fields (optional)
        const fields: any = args.fields ?? null;
        // col length
        const colLen: number = columns.length;
        // joincol1 length
        const joincol1Len: number = joincolumns1.length;
        // joincol2 length
        const joincol2Len: number = joincolumns2.length;

        // if fields exists
        if (fields) {
          // query
          queryString = 'SELECT ?? FROM ?? INNER JOIN ?? ON ??.?? = ??.?? RIGHT JOIN ?? ON ??.?? = ??.??';
          // placeholder
          placeholder = [
            fields,
            table,
            jointable1,
            table,
            originid1,
            jointable1,
            joinid1,
            jointable2,
            table,
            originid2,
            jointable2,
            joinid2,
          ];
        } else {
          // query
          queryString = 'SELECT * FROM ?? INNER JOIN ?? ON ??.?? = ??.?? RIGHT JOIN ?? ON ??.?? = ??.??';
          // placeholder
          placeholder = [
            table,
            jointable1,
            table,
            originid1,
            jointable1,
            joinid1,
            jointable2,
            table,
            originid2,
            jointable2,
            joinid2,
          ];
        }

        // if column not null
        if (colLen > 0) {
          // add where phrase
          queryString += ' WHERE';

          // loop for array
          for (let i: number = 0; i < colLen; i++) {
            // add in phrase
            queryString += ' ??.?? IN (?)';
            // push table
            placeholder.push(table);
            // push column
            placeholder.push(columns[i]);
            // push value
            placeholder.push(values[i]);

            // other than last one
            if (i < colLen) {
              // add and phrase
              queryString += ' AND';
            }
          }

          // if joincolumn1 not null
          if (joincol1Len > 0) {
            // loop for array
            for (let j: number = 0; j < joincol1Len; j++) {
              // add in phrase
              queryString += ' ??.?? IN (?)';
              // push table
              placeholder.push(jointable1);
              // push column
              placeholder.push(joincolumns1[j]);
              // push value
              placeholder.push(joinvalues1[j]);

              // other than last one
              if (j < joincol1Len) {
                // add and phrase
                queryString += ' AND';
              }
            }
          }

          // if joincolumn2 not null
          if (joincol2Len > 0) {
            // loop for array
            for (let k: number = 0; k < joincol2Len; k++) {
              // add in phrase
              queryString += ' ??.?? IN (?)';
              // push table
              placeholder.push(jointable2);
              // push column
              placeholder.push(joincolumns2[k]);
              // push value
              placeholder.push(joinvalues2[k]);

              // other than last one
              if (k < joincol2Len - 1) {
                // add and phrase
                queryString += ' AND';
              }
            }
          }

          // if column not null
          if (spanval && spantable && spanunit && spandirection) {
            // flg
            if (spandirection == 'after') {
              // query
              queryString += ` AND ${spantable}.?? > date(current_timestamp - interval ? ${spanunit})`;
            } else if (spandirection == 'before') {
              // query
              queryString += ` AND ${spantable}.?? < date(current_timestamp - interval ? ${spanunit})`;
            }
            // push span column
            placeholder.push('created_at');
            // push span limit
            placeholder.push(spanval);
          }

          // if order exists
          if (order) {
            // query
            queryString += ' ORDER BY ??.??';

            // if reverse
            if (reverse) {
              // query
              queryString += ' ASC';
            } else {
              // query
              queryString += ' DESC';
            }

            // if order exists
            if (ordertable) {
              // push ordertable
              placeholder.push(ordertable);
            } else {
              // push maintable
              placeholder.push(table);
            }
            // if order exists
            placeholder.push(order);
          }

          // if limit exists
          if (limit) {
            // query
            queryString += ' LIMIT ?';
            // push limit
            placeholder.push(limit);
          }

          // if offset exists
          if (offset) {
            // query
            queryString += ' OFFSET ?';
            // push offset
            placeholder.push(offset);
          }

          // do query
          await this.doInquiry(queryString, placeholder)
            .then((result: any) => {
              // result exists
              if (result == 'error' || result == 'empty') {
                SQL.logger.trace(`selectJoinDB: ${result}`);
              } else {
                SQL.logger.trace('selectJoinDB: success');
              }
              // do query
              resolve(result);
            })
            .catch((err: unknown) => {
              // error
              SQL.logger.error(err);
              resolve('error');
            });
        }
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve('error');
      }
    });
  };

  // update
  updateDB = async (args: updateargs): Promise<any> => {
    return new Promise(async (resolve1) => {
      try {
        SQL.logger.trace('db: updateDB mode');
        // not
        let tmpQuery: string = '';
        // placeholder array
        let placeholder: any[] = [];
        // tmp placeholder array
        let tmpPlaceholder: any[] = [];
        // table
        const table: string = args.table;
        // select columns
        const selcol: string[] = args.selcol;
        // select values
        const selval: any[] = args.selval;
        // set column
        const setcol: string[] = args.setcol;
        // set value
        const setval: any[] = args.setval;
        // span value (optional)
        const spanval: any = args.spanval ?? null;
        // span direction (optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit (optional)
        const spanunit: any = args.spanunit ?? null;
        // selcol length
        const selcolLen: number = selcol.length;
        // setcol length
        const setcolLen: number = setcol.length;
        // promise
        const promises: Promise<any>[] = [];
        // query string
        let queryString: string = 'UPDATE ?? SET ?? = ? WHERE';

        // set all conditions
        for (let i: number = 0; i < selcolLen; i++) {
          // initialize
          tmpQuery = '';
          // not
          if (selcol[i].includes('*')) {
            // query
            queryString += '?? <> ?';
            // replace asterisk
            tmpQuery = selcol[i].replace('*', '');
          } else {
            queryString += '?? = ?';
            tmpQuery = selcol[i];
          }

          // push column
          tmpPlaceholder.push(tmpQuery);
          // push value
          tmpPlaceholder.push(selval[i]);
          // other than last one
          if (i < selcolLen - 1) {
            // add 'and' phrase
            queryString += ' AND ';
          }
        }

        // set all values and execute
        for (let j = 0; j < setcolLen; j++) {
          // placeholder
          placeholder = [table];
          // add promise
          promises.push(
            new Promise(async (resolve2, _) => {
              // push column
              placeholder.push(setcol[j]);
              // push value
              placeholder.push(setval[j]);
              // add conditions
              placeholder.push(...tmpPlaceholder);

              // add span
              if (spanval && spanunit && spandirection) {
                // flg
                if (spandirection == 'after') {
                  // query
                  queryString += ` AND ?? > date(current_timestamp - interval ? ${spanunit})`;
                } else if (spandirection == 'before') {
                  // query
                  queryString += ` AND ?? < date(current_timestamp - interval ? ${spanunit})`;
                }
                placeholder.push('created_at');
                placeholder.push(spanval);
              }

              // do query
              await this.doInquiry(queryString, placeholder)
                .then((result: any) => {
                  // result exists
                  if (result == 'error' || result == 'empty') {
                    SQL.logger.trace(`updateDB: ${result}`);
                  } else {
                    SQL.logger.trace('updateDB: success');
                  }
                  // do query
                  resolve2(result);
                })
                .catch((err: unknown) => {
                  // error
                  SQL.logger.error(err);
                  resolve2('error');
                });
            })
          );
        }
        // complete
        Promise.all(promises).then((results: any) => {
          resolve1(results);
        });
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve1('error');
      }
    });
  };

  // update
  updateJoinDB = async (args: updatejoinargs): Promise<any> => {
    return new Promise(async (resolve1) => {
      try {
        SQL.logger.trace('db: updateJoinDB mode');
        // placeholder array
        let placeholder: any[] = [];
        // tmp placeholder array
        let tmpPlaceholder: any[] = [];
        // table
        const table: string = args.table;
        // select columns
        const selcol: string[] = args.selcol;
        // select values
        const selval: any[] = args.selval;
        // set column
        const setcol: string[] = args.setcol;
        // set value
        const setval: any[] = args.setval;
        // spantable (optional)
        const spantable: any = args.spantable ?? null;
        // span value (optional)
        const spanval: any = args.spanval ?? null;
        // span direction (optional)
        const spandirection: any = args.spandirection ?? null;
        // spanunit (optional)
        const spanunit: any = args.spanunit ?? null;
        // selcol length
        const selcolLen: number = selcol.length;
        // setcol length
        const setcolLen: number = setcol.length;
        // promise
        const promises: Promise<any>[] = [];
        // query string
        let queryString: string = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';

        // set all conditions
        for (let i: number = 0; i < selcolLen; i++) {
          // push column
          tmpPlaceholder.push(selcol[i]);
          // push value
          tmpPlaceholder.push(selval[i]);
          // other than last one
          if (i < selcolLen - 1) {
            // add 'and' phrase
            queryString += ' AND ?? = ?';
          }
        }

        // set all values and execute
        for (let j: number = 0; j < setcolLen; j++) {
          // placeholder
          placeholder = [table];
          // add promise
          promises.push(
            new Promise(async (resolve2) => {
              // push column
              placeholder.push(setcol[j]);
              // push value
              placeholder.push(setval[j]);
              // add conditions
              placeholder.push(...tmpPlaceholder);

              // add span
              if (spantable && spanval && spanunit && spandirection) {
                if (spandirection == 'after') {
                  // query
                  queryString += ` AND ${spantable}.?? > date(current_timestamp - interval ? ${spanunit})`;
                } else if (spandirection == 'before') {
                  // query
                  queryString += ` AND ${spantable}.?? < date(current_timestamp - interval ? ${spanunit})`;
                }
                placeholder.push('created_at');
                placeholder.push(spanval);
              }

              // do query
              await this.doInquiry(queryString, placeholder)
                .then((result: any) => {
                  // result exists
                  if (result == 'error' || result == 'empty') {
                    SQL.logger.trace(`updateJoinDB: ${result}`);
                  } else {
                    SQL.logger.trace('updateJoinDB: success');
                  }
                  resolve2(result);
                })
                .catch((err: unknown) => {
                  // error
                  SQL.logger.error(err);
                  resolve2('error');
                });
            })
          );
        }
        // complete
        Promise.all(promises).then((results: any) => {
          resolve1(results);
        });
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve1('error');
      }
    });
  };

  // insert
  insertDB = async (args: insertargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        SQL.logger.trace('db: insertDB mode');
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[] = args.values;
        // query string
        const queryString: string = 'INSERT INTO ??(??) VALUES (?)';
        // placeholder
        const placeholder: any[] = [table, columns, values];

        // do query
        await this.doInquiry(queryString, placeholder)
          .then((result: any) => {
            // result exists
            if (result == 'error' || result == 'empty') {
              resolve(result);
              SQL.logger.trace(`insertDB: ${result}`);
            } else {
              resolve(result.insertId);
              SQL.logger.trace('insertDB: success');
            }
          })
          .catch((err: unknown) => {
            // error
            SQL.logger.error(err);
            resolve('error');
          });
      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve('error');
      }
    });
  };

  // insert
  insertNoDupDB = async (args: insertnodupargs): Promise<any> => {
    return new Promise(async (resolve) => {
      try {
        SQL.logger.trace('db: insertNoDupDB mode');
        // query string
        let queryString: string
        // placeholder array
        let placeholder: any[] = [];
        // table
        const table: string = args.table;
        // columns
        const columns: string[] = args.columns;
        // values
        const values: any[] = args.values;
        // select columns
        const selcol: string[] = args.selcol;
        // select columns
        const selval: any[] = args.selval;
        // selcol length
        const selcolLen: number = args.selcol.length;
        // query string
        queryString = 'INSERT INTO ??(??) SELECT (?) WHERE NOT EXISTS (SELECT * FROM ?? WHERE ?? = ?';
        // placeholder
        placeholder = [table, columns, values, table];
        // loop for conditions
        for (let i: number = 0; i < selcolLen; i++) {
          // push column
          placeholder.push(selcol[i]);
          // push value
          placeholder.push(selval[i]);
          // other than last one
          if (i < selcolLen - 1) {
            // add 'and' phrase
            queryString += ' AND ?? = ?';
          }
        }

        // do query
        await this.doInquiry(queryString, placeholder).then((result: any) => {
          // result exists
          if (result == 'error' || result == 'empty') {
            resolve(result);
            SQL.logger.trace(`insertNoDupDB: ${result}`);
          } else {
            resolve(result.insertId);
            SQL.logger.trace('insertNoDupDB: success');
          }
        }).catch((err: unknown) => {
          // error
          SQL.logger.error(err);
          resolve('error');
        });

      } catch (e: unknown) {
        // error
        SQL.logger.error(e);
        resolve('error');
      }
    });
  };

  // empty or not
  static isEmpty(obj: Object) {
    // check whether blank
    return !Object.keys(obj).length;
  }
}

// export module
export default SQL;