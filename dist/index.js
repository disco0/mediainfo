"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var Request = require("request");
var MediaInfoLib = require('../lib/MediaInfoWasm.js');
var MediaInfoModule = false;
function Init() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    MediaInfoModule = MediaInfoLib({
                        postRun: function () {
                            resolve();
                        },
                    });
                })];
        });
    });
}
function GetSize(path, headers) {
    if (headers === void 0) { headers = {}; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    if (path.toString().indexOf('http') === 0) {
                        return Request({
                            method: 'HEAD',
                            url: path.toString(),
                            headers: headers
                        }).on('response', function (res) {
                            resolve(parseInt(res.headers['content-length'], 10) || 0);
                        }).on('error', function (err) {
                            reject(err);
                        });
                    }
                    fs_1.stat(path, function (err, stats) {
                        if (err) {
                            return reject(err);
                        }
                        resolve(stats.size || 0);
                    });
                })];
        });
    });
}
function GetStream(path, start, length, headers) {
    if (start === void 0) { start = 0; }
    if (length === void 0) { length = -1; }
    if (headers === void 0) { headers = {}; }
    // console.log('GetStream - ', path, start, length, headers)
    if (path.toString().indexOf('http') === 0) {
        return Request({
            url: path.toString(),
            headers: __assign(__assign({}, headers), { Range: "bytes=" + start + "-" + length })
        });
    }
    return fs_1.createReadStream(path, {
        highWaterMark: length,
        start: start,
    });
}
function MediaInfo(path, headers, predefinedSize) {
    var _this = this;
    if (headers === void 0) { headers = {}; }
    if (predefinedSize === void 0) { predefinedSize = 0; }
    return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
        var seekTo, stream, size, MI;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!MediaInfoModule) return [3 /*break*/, 2];
                    return [4 /*yield*/, Init()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (predefinedSize > 0) {
                        stream = GetStream(path, 0, predefinedSize, headers);
                    }
                    else {
                        stream = GetStream(path, 0, 1024 * 1024, headers);
                    }
                    return [4 /*yield*/, GetSize(path)];
                case 3:
                    size = _a.sent();
                    MI = new MediaInfoModule.MediaInfo();
                    if (predefinedSize < 1) {
                        MI.Open_Buffer_Init(size, 0);
                        stream.on('data', function (chunk) {
                            MI.Open_Buffer_Continue(chunk);
                            seekTo = MI.Open_Buffer_Continue_Goto_Get();
                            // console.log('SeekTo', seekTo);
                            if (seekTo !== -1) {
                                MI.Open_Buffer_Init(size, seekTo);
                                if (typeof (stream.close) !== 'undefined') {
                                    stream.close();
                                }
                            }
                        });
                    }
                    else {
                        MI.Open_Buffer_Init(predefinedSize, 0);
                        stream.on('data', function (chunk) {
                            MI.Open_Buffer_Continue(chunk);
                            seekTo = MI.Open_Buffer_Continue_Goto_Get();
                            if (seekTo !== -1) {
                                // TODO check further of the logic related to reading specific chunk of the stream
                                // MI.Open_Buffer_Init(size, seekTo);
                                if (typeof (stream.close) !== 'undefined') {
                                    stream.close();
                                }
                            }
                        });
                    }
                    stream.on('close', function () {
                        var newstream = {};
                        // console.log('GetStream -- oncloze', path, 0, predefinedSize, headers);
                        if (predefinedSize > 0) {
                            newstream = GetStream(path, seekTo, predefinedSize, headers);
                        }
                        else {
                            newstream = GetStream(path, seekTo, 1024 * 1024, headers);
                        }
                        newstream.on('data', function (chunk) {
                            MI.Open_Buffer_Continue(chunk);
                            seekTo = MI.Open_Buffer_Continue_Goto_Get();
                            // console.log('SeekTo ON DATA', seekTo);
                        });
                        newstream.on('close', function () {
                            MI.Open_Buffer_Finalize();
                            MI.Option('Output', 'JSON');
                            MI.Option('Complete');
                            var output = JSON.parse(MI.Inform());
                            MI.Close();
                            MI.delete();
                            resolve(output);
                        });
                    });
                    return [2 /*return*/];
            }
        });
    }); });
}
exports.default = MediaInfo;
;
