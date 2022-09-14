const PROTO_PATH="./restaurant.proto";

var mongoose = require("mongoose");
var grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");

var Menu = require('../models/menu');

require('dotenv').config()

mongoose.connect(`mongodb://localhost:27017/${process.env.DB_NAME}`, {
    "auth": { "authSource": "admin" },
    "user": process.env.DB_APP_USER,
    "pass": process.env.DB_APP_PASS
});

var packageDefinition = protoLoader.loadSync(PROTO_PATH,{
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var restaurantProto =grpc.loadPackageDefinition(packageDefinition);

const {v4: uuidv4}=require("uuid");

const server = new grpc.Server();
// const menu=[
//     {
//         id: "a68b823c-7ca6-44bc-b721-fb4d5312cafc",
//         name: "Tomyam Gung",
//         price: 500
//     },
//     {
//         id: "34415c7c-f82d-4e44-88ca-ae2a1aaa92b7",
//         name: "Somtam",
//         price: 60
//     },
//     {
//         id: "8551887c-f82d-4e44-88ca-ae2a1ccc92b7",
//         name: "Pad-Thai",
//         price: 120
//     }
// ];

server.addService(restaurantProto.RestaurantService.service,{
    getAllMenu: async (_,callback)=>{
        try {
            let menu = await Menu.find({});
            callback(null, {menu});
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Internal error"
            });
        }
    },
    get: async (call,callback)=>{
        try {
            let menuItem = await Menu.findById(call.request.id);
            callback(null, menuItem);
        } catch (error) {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not found"
            });
        }
    },
    insert: async (call, callback)=>{
        let menuItem=call.request;
        const menu = new Menu(menuItem);
        try {
          await menu.save();
          callback(null, menu);
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Internal error"
            });
        }
    },
    update: async (call,callback)=>{
        try {
            let existingMenuItem = await Menu.findByIdAndUpdate(call.request.id, {
                name: call.request.name,
                price: call.request.price,
            });
            if (!existingMenuItem) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "NOT Found"
                });
            } else {
                await existingMenuItem.save();
                callback(null, existingMenuItem);
            }
        } catch (error) {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Not Found"
            });
        }
    },
    remove: async (call, callback) => {
        try {
            let menu = await Menu.findByIdAndDelete(call.request.id);
            if (!menu) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "NOT Found"
                });
            } else {
                callback(null,{});
            }
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Internal error"
            });
        }
    }
});

server.bind("127.0.0.1:30043",grpc.ServerCredentials.createInsecure());
console.log("Server running at http://localhost:30043");
server.start();