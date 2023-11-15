const path = require('path');
const { mtproto } = require('./_mtproto_');
require("dotenv").config();


const main = async () => {
  try {
    const ret = await mtproto.sendCode(process.env.PHONE_NUMBER);
    console.log(ret);
  } catch (error) {
    console.log(error);
  }
}

main();