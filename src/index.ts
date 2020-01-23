import { PathLike, createReadStream, stat } from 'fs';
import Request = require('request');
import {
  Audio, General, Image, Menu, Other, Text, Video,
} from './types';

const MediaInfoLib = require('../lib/MediaInfoWasm.js');

interface MediaInfoResponse {
  media: {
    '@ref': string
    track: [
      Audio | General | Image | Menu | Other | Text | Video
    ]
  }
}

let MediaInfoModule: any = false;

async function Init() {
  return new Promise((resolve) => {
    MediaInfoModule = MediaInfoLib({
      postRun: () => {
        resolve();
      },
    });
  });
}

async function GetSize(path: PathLike, headers = {}) {
  return new Promise((resolve, reject) => {
    if (path.toString().indexOf('http') === 0) {
      return Request({
        method: 'HEAD',
        url: path.toString(),
        headers
      }).on('response', (res: any) => {
        resolve(parseInt(res.headers['content-length'], 10) || 0);
      }).on('error', (err: Error) => {
        reject(err);
      })
    }
    stat(path, (err, stats) => {
      if (err) {
        return reject(err);
      }
      resolve(stats.size || 0)
    })
  })
}

function GetStream(path: PathLike, start = 0, length = -1, headers = {}): any {
  // console.log('GetStream - ', path, start, length, headers)
  if (path.toString().indexOf('http') === 0) {
    return Request({
      url: path.toString(),
      headers: {
        ...headers,
        Range: `bytes=${start}-${length}`
      }
    })
  }
  return createReadStream(path, {
    highWaterMark: length,
    start,
  });
}

export default function MediaInfo(path: PathLike, headers = {}, predefinedSize = 0): Promise<MediaInfoResponse> {
  return new Promise(async (resolve) => {

    if (!MediaInfoModule) {
      await Init();
    }

    let seekTo: number;    

    var stream: any;
    if (predefinedSize > 0 ){
      stream = GetStream(path, 0, predefinedSize, headers);
    } else {
      stream = GetStream(path, 0, 1024 * 1024, headers);
    }
    
    const size = await GetSize(path);

    const MI = new MediaInfoModule.MediaInfo();

    if (predefinedSize < 1) {
      MI.Open_Buffer_Init(size, 0);
      stream.on('data', (chunk: any) => {
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
    } else {
      MI.Open_Buffer_Init(predefinedSize, 0);
      stream.on('data', (chunk: any) => {
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
    

    stream.on('close', () => {
      var newstream: any  = {};

      // console.log('GetStream -- oncloze', path, 0, predefinedSize, headers);
      if (predefinedSize > 0) {
        newstream = GetStream(path, seekTo, predefinedSize, headers);
      } else {
        newstream = GetStream(path, seekTo, 1024 * 1024, headers);
      }

      newstream.on('data', (chunk: any) => {
        MI.Open_Buffer_Continue(chunk);
        seekTo = MI.Open_Buffer_Continue_Goto_Get();
        // console.log('SeekTo ON DATA', seekTo);
      });

      newstream.on('close', () => {
        MI.Open_Buffer_Finalize();

        MI.Option('Output', 'JSON');
        MI.Option('Complete');
        const output: MediaInfoResponse = JSON.parse(MI.Inform());
        MI.Close();
        MI.delete();

        resolve(output);
      });
    });
  });
};
