const path = require("path");
const MTProto = require("@mtproto/core");
// const { sleep } = require("@mtproto/core/src/utils/common");
require("dotenv").config();
const api_id = process.env.MTP_ID;
const api_hash = process.env.MTP_HASH;
//////////////////////////////////////////////////////
class API {
  constructor() {
    this.mtproto = new MTProto({
      api_id,
      api_hash,
      // storageOptions: {
      //   instance: require("@mtproto/core/src/storage/temp")
      // }
      storageOptions: {
        path: path.resolve(__dirname, "./authKey/key.json")
      }
    });
  }

  async call(method, params, options = {}) {
    try {
      const result = await this.mtproto.call(method, params, options);

      return result;
    } catch (error) {
      console.log(`${method} error:`, error);

      const { error_code, error_message } = error;

      if (error_code === 420) {
        const seconds = Number(error_message.split("FLOOD_WAIT_")[1]);
        const ms = seconds * 1000;

        await sleep(ms);

        return this.call(method, params, options);
      }

      if (error_code === 303) {
        const [type, dcIdAsString] = error_message.split("_MIGRATE_");

        const dcId = Number(dcIdAsString);

        // If auth.sendCode call on incorrect DC need change default DC, because
        // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
        if (type === "PHONE") {
          await this.mtproto.setDefaultDc(dcId);
        } else {
          Object.assign(options, { dcId });
        }

        return this.call(method, params, options);
      }

      return Promise.reject(error);
    }
  }
  async sendCode(phone) {
    try {
      return this.call("auth.sendCode", {
        phone_number: phone,
        settings: {
          _: "codeSettings",
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async signIn({ code, phone, phone_code_hash }) {
    return this.call("auth.signIn", {
      phone_code: code,
      phone_number: phone,
      phone_code_hash: phone_code_hash,
    });
  }

  async signUp({ phone, phone_code_hash }) {
    return this.call("auth.signUp", {
      phone_number: phone,
      phone_code_hash: phone_code_hash,
      first_name: "MTProto",
      last_name: "Core",
    });
  }

  async getPassword() {
    return this.call("account.getPassword");
  }

  async checkPassword({ srp_id, A, M1 }) {
    return this.call("auth.checkPassword", {
      password: {
        _: "inputCheckPasswordSRP",
        srp_id,
        A,
        M1,
      },
    });
  }
}

const api = new API();
///function//////////////////////////////////////////////////////////

async function telegram() {
  // 1. Create instance

  // 2. Print the user country code
  // api.call("help.getNearestDc").then((result) => {
  //   console.log("country:", result.country);
  // });

  const resolvedPeer = api
    .call("contacts.resolveUsername", {
      username: "@felix619"
    })
    .then((result) => {
      console.log(result);
    });
  console.log(resolvedPeer);
  // if (resolvedPeer) {
  //   const channel = resolvedPeer.chats.find(
  //     (chat) => chat.id === resolvedPeer.peer.channel_id
  //   );
  //   console.log(channel);
  // }

  console.log("This is moto test !!!");
}
// Helper function to sleep for a specified duration
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
module.exports = { mtproto: api };
