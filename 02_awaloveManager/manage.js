/**
 * manage.js
 *
 * function：chat management server
 **/

"use strict";

require("dotenv").config(); // env

// constants
const SERVERNAME = "shopifyManageServer"; // server name
const PORT = process.env.PORT; // default port number
const ROOTURL = process.env.ROOTURL; // root
const SHIPPING_FEE = 550; // posting fee

// modules
const express = require("express"); // express
const basicAuth = require("basic-auth-connect"); // basic-auth
const SQL = require("./class/sql.js"); // sql

// express
const app = express();

// use ejs
app.set("view engine", "ejs");
// static folder
app.use(express.static("public"));
// use json
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true, // allow extended use
    })
);

// basic login
app.all(
    "/*",
    basicAuth((user, password) => {
        return user === process.env.AUTHID && password === process.env.PASSWORD;
    })
);

// db
const myDB = new SQL(
    process.env.HOST, // host name
    process.env.MANAGEUSER, // user name
    process.env.MANAGEPASS, // user password
    process.env.DBNAME // database name
);

// * data columns
// prefectures
let globalAllPreNames = [];
// user
const userColumns = [
    "shopname",
    "username",
    "prefecture_id",
    "city",
    "address",
    "zipcode",
    "telephone",
    "mailaddress",
    "active",
];
// order
const orderColumns = [
    "shopname",
    "username",
    "prefecture_id",
    "city",
    "address",
    "telephone",
    "mailaddress",
    "product_id",
    "quantity",
    "totalprice",
    "completed",
    "contact_id",
    "shipped",
];

// - get
// * dispaly mode
// root
app.get("/", async (_, res) => {
    console.log("connected.");
    // result
    const prefObj = await selectFullDB("prefecture", "id");
    // all pref names
    globalAllPreNames = await Promise.all(
        prefObj.map(async (pref) => pref.prefname)
    );
    // render page
    res.render("index", { title: "shopify管理", root: ROOTURL });
});

// order
app.get("/order", async (req, res) => {
    // result
    let allData;
    // query
    const searchwd = req.query.searchwd ? req.query.searchwd.trim() : ""; // search word
    const target = req.query.radio01; // mode
    const itemQuery = req.query.item ?? "id"; // order
    const sortQuery = req.query.sort ?? "asc"; // direction

    // columns
    const columns = [
        "id",
        "manage_no",
        "shopname",
        "username",
        "city",
        "address",
        "telephone",
        "mailaddress",
        "payment_id",
        "template_id",
        "product_id",
        "quantity",
        "totalprice",
        "paid",
        "contact_id",
        "shipped",
        "created_at",
        "updated_at",
    ];

    try {
        // if search word exists
        if (searchwd) {
            // switch on mode
            switch (target) {
                case "1":
                    // extract from phone number
                    allData = await selectDoubleDB(
                        "draftorder",
                        "telephone",
                        searchwd,
                        "completed",
                        1,
                        columns,
                        itemQuery
                    );
                    break;

                case "2":
                    // extract from user name
                    allData = await fuzzySelectDoubleDB(
                        "draftorder",
                        "username",
                        searchwd,
                        "completed",
                        1,
                        columns,
                        itemQuery
                    );
                    break;

                default:
                    // select all
                    allData = await selectDB(
                        "draftorder",
                        "completed",
                        1,
                        columns,
                        itemQuery
                    );
                    break;
            }
        } else {
            // select all
            allData = await selectDB(
                "draftorder",
                "completed",
                1,
                columns,
                itemQuery
            );
        }

        // do rendering
        doRendering(res, allData, "order", "注文管理", target, sortQuery);
    } catch (e) {
        // error
        console.log(e);
    }
});

// user
app.get("/user", async (req, res) => {
    // result
    let allData;
    // query
    const searchwd = req.query.searchwd ? req.query.searchwd.trim() : ""; // search word
    const sortQuery = req.query.sort ?? "asc"; // direction
    const itemQuery = req.query.item ?? "id"; // order

    // columns
    const columns = [
        "id",
        "shopname",
        "username",
        "city",
        "address",
        "telephone",
        "mailaddress",
        "perchase",
        "active",
        "created_at",
        "updated_at",
    ];

    try {
        // search word exists
        if (searchwd) {
            // select user
            allData = await fuzzySelectDB(
                "user",
                "username",
                searchwd,
                columns,
                itemQuery
            );
        } else {
            // select user
            allData = await selectAllDB("user", columns, itemQuery);
        }

        // do rendering
        doRendering(res, allData, "user", "ユーザ管理", "", sortQuery);
    } catch (e) {
        // error
        console.log(e);
    }
});

// * master
// contact
app.get("/contact", async (req, res) => {
    // query
    const sortQuery = req.query.sort ?? "asc"; // direction
    const itemQuery = req.query.item ?? "id"; // order
    // columns
    const columns = ["id", "contactname", "method", "created_at", "updated_at"];

    try {
        // select user
        await selectAllDB("contact", columns, itemQuery);

        // do rendering
        doRendering(
            res,
            myDB.getValue,
            "contact",
            "問い合わせ管理",
            "",
            sortQuery
        );
    } catch (e) {
        // error
        console.log(e);
    }
});

// product
app.get("/product", async (req, res) => {
    // query
    const sortQuery = req.query.sort ?? "asc"; // direction
    const itemQuery = req.query.item ?? "id"; // order
    // columns
    const columns = [
        "id",
        "productname",
        "price",
        "fixprice",
        "amount",
        "type_id",
        "taxrate",
        "variant_id",
        "created_at",
        "updated_at",
    ];

    try {
        // select product
        const allData = await selectAllDB("product", columns, itemQuery);

        // do rendering
        doRendering(res, allData, "product", "商品管理", "", sortQuery);
    } catch (e) {
        // error
        console.log(e);
    }
});

// template
app.get("/template", async (req, res) => {
    // query
    const sortQuery = req.query.sort ?? "asc"; // direction
    const itemQuery = req.query.item ?? "id"; // order
    // columns
    const columns = [
        "id",
        "templatename",
        "genre_id",
        "imageurl",
        "manageno",
        "created_at",
        "updated_at",
    ];

    try {
        // select user
        await selectAllDB("template", columns, itemQuery);

        // do rendering
        doRendering(
            res,
            myDB.getValue,
            "template",
            "テンプレート管理",
            "",
            sortQuery
        );
    } catch (e) {
        // error
        console.log(e);
    }
});

// type
app.get("/type", async (req, res) => {
    // query
    const sortQuery = req.query.sort ?? "asc"; // direction
    const itemQuery = req.query.item ?? "id"; // order
    // columns
    const columns = ["id", "typename", "created_at", "updated_at"];

    try {
        // select user
        const allData = await selectAllDB("type", columns, itemQuery);

        // do rendering
        doRendering(res, allData, "type", "タイプ管理", "", sortQuery);
    } catch (e) {
        // error
        console.log(e);
    }
});

// genre
app.get("/genre", async (req, res) => {
    // query
    const sortQuery = req.query.sort ?? "asc"; // direction
    const itemQuery = req.query.item ?? "id"; // order
    // columns
    const columns = ["id", "genrename", "created_at", "updated_at"];

    // select user
    const allData = await selectAllDB("genre", columns, itemQuery);

    // do rendering
    doRendering(res, allData, "genre", "ラベルジャンル管理", "", sortQuery);
});

// * new mode
// order new
app.get("/order_new", async (_, res) => {
    res.render("order_new", { title: "注文登録", prefs: globalAllPreNames });
});

// user new
app.get("/user_new", async (_, res) => {
    res.render("user_new", { title: "ユーザ登録", prefs: globalAllPreNames });
});

// * edit mode
// order edit
app.get("/order_edit/:id", async (req, res) => {
    // order id
    const orderId = req.params.id;
    // field columns
    const columns = [
        "id",
        "template_id",
        "contact_id",
        "manage_no",
        "reason",
        "label_text",
        "shopname",
        "username",
        "prefecture_id",
        "city",
        "address",
        "telephone",
        "mailaddress",
        "product_id",
        "quantity",
        "totalprice",
        "paid",
        "fromchat",
        "payment_id",
        "contact_id",
        "completed",
        "shipped",
        "uselogo",
    ];

    // do edit
    doEditing(res, orderId, columns, "draftorder", "order_edit", "注文編集");
});

// user edit
app.get("/user_edit/:id", async (req, res) => {
    // user id
    const userId = req.params.id;
    // column
    const columns = [
        "id",
        "shopname",
        "username",
        "prefecture_id",
        "city",
        "address",
        "zipcode",
        "telephone",
        "mailaddress",
        "perchase",
        "active",
    ];

    // do edit
    doEditing(res, userId, columns, "user", "user_edit", "ユーザ編集");
});

//* check
// check order
app.get("/check_order", async (req, res) => {
    // alldata
    let allData;
    // searchwd
    const searchwd = req.query.searchwd ? req.query.searchwd.trim() : ""; // search word
    // mode
    const mode = req.query.mode;

    try {
        // swith on mode
        if (mode == "1") {
            // select order from telephone
            allData = await selectCountDB(
                "draftorder",
                "telephone",
                getLowerNumber(searchwd.split("-").join(""))
            );
        } else if (mode == "2") {
            // select order from username
            allData = await selectDoubleCountDB(
                "draftorder",
                "username",
                searchwd,
                "completed",
                1
            );
        } else {
            // error
            res.status(400).send(new Error("description"));
        }

        // return result
        if (allData == "error" || allData == 0) {
            res.status(400).send(new Error("description"));
        } else {
            res.send("ok");
        }
    } catch (e) {
        // error
        console.log(e);
    }
});

// check user
app.get("/check_user", async (req, res) => {
    // searchwd
    const searchwd = req.query.searchwd ? req.query.searchwd.trim() : ""; // search word

    try {
        // select from username
        const allData = await selectCountDB("user", "username", searchwd);

        // error
        if (allData == "error" || allData == 0) {
            // send error
            res.status(400).send(new Error("description"));
        } else {
            // send ok
            res.send("ok");
        }
    } catch (e) {
        // error
        console.log(e);
    }
});

// * master
// contact
app.get("/contact", async (_, res) => {
    // render page
    res.render("contact", { title: "問い合わせマスタ" });
});

// product
app.get("/product", async (_, res) => {
    // render page
    res.render("product", { title: "商品マスタ" });
});

// template
app.get("/template", async (_, res) => {
    // render page
    res.render("template", { title: "テンプレートマスタ" });
});

// type
app.get("/type", async (_, res) => {
    // render page
    res.render("type", { title: "種別マスタ" });
});

// genre
app.get("/genre", async (_, res) => {
    // render page
    res.render("genre", { title: "ラベルジャンルマスタ" });
});

// - post
// * update mode
// order update
app.post("/order_update", async (req, res) => {
    // id
    const orderId = req.body.id;
    // manage_no
    const manageNo = req.body.manage_no;
    // label id
    const labelId = req.body.labelid;
    // reason
    const reason = req.body.reason.trim();
    // label text
    const labelText = req.body.labeltxt;
    // shopname
    const shopname = req.body.shopname;
    // username
    const username = req.body.username;
    // prefecture
    const prefecture = req.body.prefecture;
    // city
    const city = req.body.city;
    // address
    const address = req.body.address;
    // telephone
    const telephone = req.body.telephone.split("-").join("");
    // mailaddress
    const mailaddress = req.body.mailaddress;
    // paid
    const paid = req.body.paid;
    // payment id
    const paymentId = req.body.payment_id;
    // fromchat
    const fromchat = req.body.fromchat;
    // completed
    const completed = req.body.completed;
    // shipped
    const shipped = req.body.shipped;
    // uselogo
    const uselogo = req.body.uselogo;

    try {
        // no id
        if (!orderId) {
            throw new Error("no id!");
        }

        // manage_no
        if (manageNo) {
            await updateDB("draftorder", "manage_no", manageNo, orderId);
        }

        // label id
        if (labelId) {
            await updateDB("draftorder", "template_id", labelId, orderId);
        }

        // reason
        if (reason) {
            await updateDB("draftorder", "reason", reason, orderId);
        }

        //label text
        if (labelText) {
            await updateDB("draftorder", "label_text", labelText, orderId);
        }

        // shopname exists
        if (shopname) {
            await updateDB("draftorder", "shopname", shopname, orderId);
        }

        // username exists
        if (username) {
            await updateDB("draftorder", "username", username, orderId);
        }

        // prefecture exists
        if (prefecture) {
            await updateDB("draftorder", "prefecture_id", prefecture, orderId);
        }

        // city exists
        if (city) {
            await updateDB("draftorder", "city", city, orderId);
        }

        // address exists
        if (address) {
            await updateDB("draftorder", "address", address, orderId);
        }

        // telephone exists
        if (telephone) {
            await updateDB("draftorder", "telephone", telephone, orderId);
        }

        // mailaddress exists
        if (mailaddress) {
            await updateDB("draftorder", "mailaddress", mailaddress, orderId);
        }

        // payment id
        if (paymentId) {
            await updateDB("draftorder", "payment_id", paymentId, orderId);
        }

        // paid exists
        if (paid !== undefined) {
            await updateDB("draftorder", "paid", 1, orderId);
        } else {
            await updateDB("draftorder", "paid", 0, orderId);
        }

        // fromchat exists
        if (fromchat !== undefined) {
            await updateDB("draftorder", "fromchat", 1, orderId);
        } else {
            await updateDB("draftorder", "fromchat", 0, orderId);
        }

        // completed exists
        if (completed !== undefined) {
            await updateDB("draftorder", "completed", 1, orderId);
        } else {
            await updateDB("draftorder", "completed", 0, orderId);
        }

        // shipped exists
        if (shipped !== undefined) {
            await updateDB("draftorder", "shipped", 1, orderId);
        } else {
            await updateDB("draftorder", "shipped", 0, orderId);
        }

        // uselogo exists
        if (uselogo !== undefined) {
            await updateDB("draftorder", "uselogo", 1, orderId);
        } else {
            await updateDB("draftorder", "uselogo", 0, orderId);
        }

        // render complete page
        res.render("completed", {
            title: "注文編集が完了しました。",
            url: "/order?item=id&sort=desc",
        });
    } catch (e) {
        // error
        console.log(e);
    }
});

// user update
app.post("/user_update", async (req, res) => {
    // id
    const userId = req.body.id;
    // user name
    const shopname = req.body.shopname;
    // user name
    const username = req.body.username;
    // prefecture
    const prefecture = req.body.prefecture;
    // city
    const city = req.body.city;
    // address
    const address = req.body.address;
    // telephone
    const telephone = req.body.telephone.split("-").join("");
    // mail
    const email = req.body.mailaddress;
    // perchase
    const perchase = req.body.perchase;
    // active
    const active = req.body.active;

    try {
        // no id
        if (!userId) {
            throw new Error("no id!");
        }

        // username exists
        if (shopname) {
            await updateDB("user", "shopname", shopname, userId);
        }

        // username exists
        if (username) {
            await updateDB("user", "username", username, userId);
        }

        // prefecture exists
        if (prefecture) {
            await updateDB("user", "prefecture_id", prefecture, userId);
        }

        // city exists
        if (city) {
            await updateDB("user", "city", city, userId);
        }

        // address exists
        if (address) {
            await updateDB("user", "address", address, userId);
        }

        // telephone exists
        if (telephone) {
            await updateDB("user", "telephone", telephone, userId);
        }

        // email exists
        if (email) {
            await updateDB("user", "mailaddress", email, userId);
        }

        // perchase exists
        if (perchase !== undefined) {
            await updateDB("user", "perchase", 1, userId);
        } else {
            await updateDB("user", "perchase", 0, userId);
        }

        // active exists
        if (active !== undefined) {
            await updateDB("user", "active", 1, userId);
        } else {
            await updateDB("user", "active", 0, userId);
        }

        // render complete page
        res.render("completed", {
            title: "ユーザ編集が完了しました。",
            url: "/user?item=id&sort=desc",
        });
    } catch (e) {
        // error
        console.log(e);
    }
});

// * new registration mode
// order regist
app.post("/order_regist", async (req, res) => {
    // user shopname
    const shopname = req.body.shopname;
    // user username
    const username = req.body.username;
    // prefecture id
    const pref_id = Number(req.body.prefecture);
    // city
    const city = req.body.city;
    // address
    const address = req.body.address;
    // telephone
    const telephone = req.body.telephone.split("-").join("");
    // mail address
    const mailaddress = req.body.mailaddress;
    // proudct id
    const productid = Number(req.body.productid);
    // quantity
    const quantity = Number(req.body.quantity);

    try {
        // search product price
        const tmpPriceResult = await selectDB(
            "product",
            "id",
            productid,
            ["price"],
            "id"
        );
        // calc total price
        const tmpTotalPrice = tmpPriceResult[0].price * quantity + SHIPPING_FEE;
        // register data
        await insertDB("draftorder", orderColumns, [
            shopname,
            username,
            pref_id,
            city,
            address,
            telephone,
            mailaddress,
            productid,
            quantity,
            tmpTotalPrice,
            1,
            1,
            0,
        ]);

        // render complete page
        res.render("completed", {
            title: "注文登録が完了しました。",
            url: "/order?item=id&sort=desc",
        });
    } catch (e) {
        // error
        console.log(e);
    }
});

// user regist
app.post("/user_regist", async (req, res) => {
    // shop name
    const shopname = req.body.shopname;
    // user name
    const username = req.body.username;
    // zipcode
    const zipcode = req.body.zipnumber;
    // prefecture
    const prefecture_id = Number(req.body.prefecture);
    // city
    const city = req.body.city;
    // address
    const address = req.body.address;
    // phone number
    const phonenumber = req.body.telephone.split("-").join("");
    // mail address
    const mailaddress = req.body.mailaddress;
    // active
    const active = 1;

    try {
        // register data
        await insertDB("user", userColumns, [
            shopname,
            username,
            prefecture_id,
            city,
            address,
            zipcode,
            phonenumber,
            mailaddress,
            active,
        ]);

        // render complete page
        res.render("completed", {
            title: "ユーザ登録が完了しました。",
            url: "/user?item=id&sort=desc",
        });
    } catch (e) {
        // error
        console.log(e);
    }
});

// * search mode
// product id search
app.post("/productid_search", async (req, res) => {
    // product name
    const productname = req.body.productname;

    try {
        // search data
        const allData = await fuzzySelectDB(
            "product",
            "productname",
            productname,
            ["id", "productname"],
            "id"
        );
        // result
        const result = allData ?? [];

        // single result
        if (result.length == 1) {
            // return json
            res.json({
                data: result[0].id,
                title: "商品検索が完了しました。",
                flg: false,
            });
        } else {
            // return json
            res.json({
                data: result,
                title: "商品が複数ヒットしました。",
                flg: true,
            });
        }
    } catch (e) {
        // error
        console.log(e);
    }
});

// - database operation
// * select
// select from database
const selectDB = async (table, column, values, field, order) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry(
                "SELECT ?? FROM ?? WHERE ?? IN (?) ORDER BY ??",
                [field, table, column, values, order]
            );
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// select on multiple condition
const selectDoubleDB = async (
    table,
    column1,
    value1,
    column2,
    value2,
    field,
    order
) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry(
                "SELECT ?? FROM ?? WHERE ?? IN (?) AND ?? IN (?) ORDER BY ??",
                [field, table, column1, value1, column2, value2, order]
            );
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// select all from database
const selectAllDB = async (table, field, order) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry("SELECT ?? FROM ?? ORDER BY ??", [
                field,
                table,
                order,
            ]);
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// select full from database
const selectFullDB = async (table, order) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry("SELECT * FROM ?? ORDER BY ??", [
                table,
                order,
            ]);
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// select from database fuzzily
const fuzzySelectDB = async (table, column, value, field, order) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry(
                "SELECT ?? FROM ?? WHERE ?? LIKE CONCAT('%',?,'%') ORDER BY ??",
                [field, table, column, value, order]
            );
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// select from database fuzzily on multiple condition
const fuzzySelectDoubleDB = async (
    table,
    column1,
    value1,
    column2,
    value2,
    field,
    order
) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry(
                "SELECT ?? FROM ?? WHERE ?? LIKE CONCAT('%',?,'%') AND ?? IN (?) ORDER BY ??",
                [field, table, column1, value1, column2, value2, order]
            );
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// count from database
const selectCountDB = async (table, column, values) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry("SELECT COUNT (?? = ? OR NULL) FROM ??", [
                column,
                values,
                table,
            ]);
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// count on multiple from database
const selectDoubleCountDB = async (
    table,
    column1,
    values1,
    column2,
    value2
) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry(
                "SELECT COUNT (?? = ? AND ?? = ? OR NULL) FROM ??",
                [column1, values1, column2, value2, table]
            );
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// * insert
// insert into database
const insertDB = async (table, column, values) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry("INSERT INTO ??(??) VALUES (?)", [
                table,
                column,
                values,
            ]);
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// * update
// update data
const updateDB = async (table, column, value, id) => {
    return new Promise(async (resolve, reject) => {
        try {
            // query
            await myDB.doInquiry("UPDATE ?? SET ?? = ? WHERE id = ?", [
                table,
                column,
                value,
                id,
            ]);
            // resolve
            resolve(myDB.getValue);
        } catch (e) {
            // error
            reject(e);
        }
    });
};

// * listen to port
app.listen(PORT, () => {
    console.log(`${SERVERNAME} listening on port ${PORT}`);
});

// * functions
// do rendering
const doRendering = (res, data, view, title, mode, sort) => {
    return new Promise(async (resolve, reject) => {
        try {
            // result
            let allData = data ?? "";
            // full address
            let fullAddressLists = [];

            // if error
            if (allData == "error" || allData == "") {
                allData = [];

                // when desc
            } else if (sort == "desc") {
                // reverse data
                allData.reverse();
            }

            // updated time
            const updatedTimeLists = await Promise.all(
                // time
                allData.map(async (time) =>
                    time.updated_at
                        ? await getJSTdatetime(time.updated_at)
                        : await getJSTdatetime(time.created_at)
                )
            );

            if (view == "user" || view == "order") {
                // full address
                fullAddressLists = await Promise.all(
                    allData.map(async (add) => add.city + add.address)
                );
                // render page
                res.render(view, {
                    data: allData,
                    address: fullAddressLists,
                    time: updatedTimeLists,
                    title: title,
                    mode: mode,
                    root: ROOTURL,
                });
            } else {
                // render page
                res.render(view, {
                    data: allData,
                    time: updatedTimeLists,
                    title: title,
                    mode: mode,
                });
            }

            // resolved
            resolve();
        } catch (e) {
            // error
            console.log(e);
            // reject
            reject();
        }
    });
};

// do editing
const doEditing = (res, id, columns, table, view, title) => {
    return new Promise(async (resolve, reject) => {
        try {
            // if no order id
            if (!id) {
                throw new Error("id does not exists!");
            }
            // select from id
            const allData = await selectDB(table, "id", id, columns, "id");
            // result
            const resultObj = allData[0] ?? {};
            // result
            const prefObj = await selectFullDB("prefecture", "id");
            // all pref names
            globalAllPreNames = await Promise.all(
                prefObj.map(async (pref) => pref.prefname)
            );
            // render page
            res.render(view, {
                data: resultObj,
                prefs: globalAllPreNames,
                title: title,
            });

            // resolved
            resolve();
        } catch (e) {
            // error
            console.log(e);
            // reject
            reject();
        }
    });
};

// change Upper to Lower Number
const getLowerNumber = (str) => {
    // change Upper to Lower Number
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
};

// get jst time from utc
const getJSTdatetime = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            // get jst time
            const jstTime = date.toLocaleString({ timeZone: "Asia/Tokyo" });
            // resolve
            resolve(jstTime);
        } catch (e) {
            // error
            console.log(e);
            // reject
            reject();
        }
    });
};
