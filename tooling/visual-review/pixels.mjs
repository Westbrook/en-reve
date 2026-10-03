/** Executed in a dedicated browser page using only public Canvas/image APIs. */
export async function comparePixels({expected,actual,settings}) {
 const decode=async text=>{const image=new Image();image.src='data:image/png;base64,'+text;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);return {width:canvas.width,height:canvas.height,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};};
 const a=await decode(expected),b=await decode(actual);const width=Math.max(a.width,b.width),height=Math.max(a.height,b.height);
 if(width*height>32_000_000)throw new Error('Comparison exceeds32 million pixels.');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');const diff=ctx.createImageData(width,height);let differentPixels=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const out=(y*width+x)*4,ai=(y*a.width+x)*4,bi=(y*b.width+x)*4;
  const different=x>=a.width||x>=b.width||y>=a.height||y>=b.height||[0,1,2,3].some(c=>Math.abs(a.data[ai+c]-b.data[bi+c])>settings.channelThreshold);
  if(different){differentPixels++;diff.data.set([225,0,90,255],out);}else{const gray=Math.round((b.data[bi]+b.data[bi+1]+b.data[bi+2])/3);diff.data.set([gray,gray,gray,90],out);}
 }
 ctx.putImageData(diff,0,0);const dimensionsMatch=a.width===b.width&&a.height===b.height;
 return {expected:{width:a.width,height:a.height},actual:{width:b.width,height:b.height},differentPixels,totalPixels:width*height,dimensionsMatch,match:dimensionsMatch&&differentPixels<=settings.maxDifferentPixels,diff:canvas.toDataURL('image/png').split(',')[1]};
}
