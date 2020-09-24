/// <reference types="node" />
import { PathLike } from 'fs';
import { Audio, General, Image, Menu, Other, Text, Video } from './types';
interface MediaInfoResponse {
    media: {
        '@ref': string;
        track: [Audio | General | Image | Menu | Other | Text | Video];
    };
}
export default function MediaInfo(path: PathLike, headers?: {}, predefinedSize?: number): Promise<MediaInfoResponse>;
export {};
