// Inspect dimensions without decoding attacker-controlled compressed pixels.
export function imageDimensions(bytes:Buffer,mime:string):{width:number;height:number}|undefined {
 if(mime==='image/png'){
  if(bytes.length<33||bytes.subarray(12,16).toString('ascii')!=='IHDR')return;
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
 }
 if(mime!=='image/jpeg')return;
 let offset=2;
 while(offset+4<=bytes.length){
  if(bytes[offset++]!==0xff)return;
  while(offset<bytes.length&&bytes[offset]===0xff)offset++;
  const marker=bytes[offset++];
  if(marker===0xd9||marker===0xda)return;
  if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;
  if(offset+2>bytes.length)return;
  const length=bytes.readUInt16BE(offset);
  if(length<2||offset+length>bytes.length)return;
  if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
   if(length<8)return;
   return {width:bytes.readUInt16BE(offset+5),height:bytes.readUInt16BE(offset+3)};
  }
  offset+=length;
 }
}
