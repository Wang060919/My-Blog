// Validate untrusted cache responses before touching the existing static calendar.
export function validateLiveSnapshot(data, now = Date.now()) {
  const levels=['NONE','FIRST_QUARTILE','SECOND_QUARTILE','THIRD_QUARTILE','FOURTH_QUARTILE'];
  const day=86400000, stamp=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('date');const n=Date.parse(value+'T00:00:00Z');if(new Date(n).toISOString().slice(0,10)!==value)throw Error('date');return n;};
  if(data?.schemaVersion!==1||data.status!=='ready'||data.example!==false||data.username!=='Wang060919'||data.source!=='github-graphql'||!Array.isArray(data.weeks)||data.weeks.length>54)throw Error('snapshot');
  const start=stamp(data.from),end=stamp(data.to),time=Date.parse(data.fetchedAt);
  if(end<start||end-start>366*day||!Number.isFinite(time)||time>now+300000||end>time)throw Error('range');
  let index=0,total=0,active=0,position=0;
  const leading=new Date(start).getUTCDay(),count=(end-start)/day+1;
  for(const week of data.weeks){if(!Array.isArray(week.days)||week.days.length!==7)throw Error('week');for(const d of week.days){const inRange=position>=leading&&position<leading+count;position++;if(!inRange){if(d!==null)throw Error('padding');continue;}if(!d||stamp(d.date)!==start+index++*day||!Number.isSafeInteger(d.count)||d.count<0||!Number.isInteger(d.level)||d.level<0||d.level>4||levels[d.level]!==d.contributionLevel||(d.count===0)!==(d.level===0))throw Error('day');total+=d.count;if(d.count)active++;}}
  if(index!==count||position!==Math.ceil((leading+count)/7)*7||total!==data.total||active!==data.activeDays)throw Error('total');
  return data;
}
export async function fetchLiveSnapshot(endpoint, fetchImpl = fetch) {
  const url = new URL(endpoint); if(url.protocol!=='https:'||url.pathname!=='/api/contributions'||url.search||url.hash||url.username||url.password)throw Error('endpoint');
  const response=await fetchImpl(url.href,{credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json')||Number(response.headers.get('content-length'))>100000)throw Error('response');
  const reader=response.body.getReader(),parts=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>100000)throw Error('size');parts.push(value);}}catch(error){await reader.cancel();throw error;}
  const body=new Uint8Array(length);let offset=0;for(const part of parts){body.set(part,offset);offset+=part.byteLength;}
  return validateLiveSnapshot(JSON.parse(new TextDecoder().decode(body)));
}
