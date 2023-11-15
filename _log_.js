const fs = require('fs');
var debug_mode = 2;
//0 = log to console
//1 += log to file
//2 += console log performance_timer
const log_file_dir = __dirname + "/logs/";
const log_file_expire_limit = 7;// unit day
const time_lapse_key_name = "log_start_time";
const log_file_remover_timer = setInterval(() => {
  remove_out_date_files();
}, (1000 * 60 * 60) * 12);//12 hours check once
////main//////////////////////////////////////
function log_error() {
  const [req, res] = arguments;
  const payload = Object.values(arguments).slice(2);
  console.error(new Date().toLocaleString(), ...payload);
  if (debug_mode >= 1) log_to_file(req, res, "error", payload);
}
function log() {
  console.log(new Date().toLocaleString(), ...arguments);
}
function log_db_error() {
  console.error(new Date().toLocaleString(), ...arguments);
  if (debug_mode >= 1) log_to_file(undefined, undefined, "db-error", arguments);
}
const remove_out_date_files = () => {
  fs.readdir(log_file_dir, (err, files) => {
    if (err) return;
    for (let file of files) {
      let current_time = new Date().getTime();
      let time_diff = (current_time - new Date(file.split("-", 3).join("-")).getTime()) / 86400000;
      if (time_diff > log_file_expire_limit) {
        fs.unlink(path.resolve(`${log_file_dir}${file}`), (err) => {
          console.log(`${file} deleted`, `error :${err}`);
        });
      }
    }
  });
}

function log_to_file(req, res, type = "request", message) {
  let d = new Date();
  let content = {
    date: d.toLocaleString(),
    method: req?.method || undefined,
    lapse: req ? d.getTime() - req[time_lapse_key_name] : undefined,
    ip: req !== undefined ? `${req.socket?.remoteAddress}:${req.socket?.remotePort}` : undefined,
    statusCode: res?.statusCode || undefined,
    url: req?.url || undefined,
    message
  }
  fs.writeFile(`${log_file_dir}${get_date(d)}-${type}_log.txt`, JSON.stringify(content) + ",\r\n", { 'flag': 'a' }, writeFile_error_ENOENT);
}

//hepler///////////////////////////
function writeFile_error_ENOENT(err) {
  if (err && err.code == "ENOENT") {
    fs.mkdir(`${log_file_dir}`, () => { });
    console.log(err);
    log_error(err);
  }
}
function get_date(d) {
  return d.toISOString().slice(0, 10);
}
///class///////////////////////////////////////
class performance_timer {
  constructor(function_info) {
    if (debug_mode < 2) return;
    this.start_time = process.uptime();
    this.checkpoint = [`performance timer -${function_info.name}- time unit - seconds`];
  }
  add_tick(tick_name) {
    if (debug_mode < 2) return;
    this.checkpoint.push({
      name: tick_name,
      time: (process.uptime() - this.start_time)
    })
  }
  done() {
    if (debug_mode < 2) return;
    this.add_tick("ending");
    console.log(this.checkpoint);
  }
}
////mode switcher//////////////////////////////////////
function set_log_mode(int) {
  debug_mode = int;
}
///export///////////////////////////////////////
module.exports = {
  log_error,
  log,
  log_db_error,
  performance_timer,
  set_log_mode,
  log_to_file,
  time_lapse_key_name
};