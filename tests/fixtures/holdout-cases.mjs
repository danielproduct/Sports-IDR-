/** Additional synthetic holdout cases written after the first scoring revision.
 * These are fictional, not a statistical sample of football data.
 * The engine must not be tuned against these cases during this validation round.
 */
const x = (name, dob='', position='Midfielder', club='Collins Cross FC', external_id='', source='') =>
  ({name,dob,position,club,external_id,source});

const same = [
  [x('Lena Osborne','2000-04-01'),x('Lena Osborne','2000-04-01')],
  [x('Daniel Redwood','2001-02-02'),x('Dan Redwood','2001-02-02')],
  [x('William Haynes','1999-03-03'),x('Will Haynes','1999-03-03')],
  [x('Thomas Etheridge','2000-04-04'),x('Thomas Etridge','2000-04-04')],
  [x('J\u00e9r\u00f4me Barrett','1998-05-05'),x('Jerome Barrett','1998-05-05')],
  [x('Isla Graham','2002-06-06'),x('Isla Graham')],
  [x('Freddie Lewis'),x('Freddie Lewis')],
  [x('Callum Drake','2001-08-08','Defender','Collins Cross FC','','Scouting Register'),x('Callum Drake','2001-08-08','Defender','Collins Cross FC','','Scouting Register')],
  [x('Jayden Murphy','1999-09-09'),x('Murphy Jayden','1999-09-09')],
  [x('Kara North','2003-10-10'),x('K. North','2003-10-10')],
  [x('Amira Shah','1998-11-11','Midfielder','Collins Cross FC','GLOBAL-820'),x('Amira King','1998-11-11','Midfielder','Collins Cross FC','GLOBAL-820')],
  [x('Owen Sinclair','2000-12-12','Striker'),x('Owen Sinclair','2000-12-12','Goalkeeper')],
  [x('Muhammad Al-Sayed','2001-01-13'),x('Mohammed Al Sayed','2001-01-13')],
  [x('Nicola Pearce','2000-02-14'),x('Nicky Pearce','2000-02-14')],
  [x('Daniel Finch'),x('Dan Finch')],
  [x('Joseph Quill','2002-03-16','Forward','Southdale FC'),x('Joe Quill','2002-03-16','Forward','Collins Cross FC')],
  [x('Aiden Sparrow','2001-05-17'),x('Aidan Sparrow','2001-05-17'),x('Aiden Sparrow','2001-05-17','Defender','Collins Cross FC','','Trialist Log')]
];
const different = [
  [x('Martin Ray','2000-01-01'),x('Martin Ray','2001-01-01')],
  [x('Dakota Brown'),x('Dakota Brown')],
  [x('Logan Webb','2002-02-02'),x('Logan Webb')],
  [x('Alexa Walsh'),x('Alex Walsh')],
  [x('Eleanor Page','1998-03-03','Midfielder','Collins Cross FC','GLOBAL-930'),x('Eleanor Page','1998-03-03','Midfielder','Collins Cross FC','GLOBAL-931')],
  [x('Thomas Ellis','2002-04-04'),x('Tony Ellis','2002-04-04')],
  [x('Isaac Porter','2001-05-05'),x('Isaac Porter','2001-05-05')],
  [x('Tania Flynn','1999-06-06'),x('Tara Flynn','1999-06-06')],
  [x('J. Benton','2000-07-07'),x('James Benton','2000-07-07')],
  [x('Lauren A Reed'),x('Lauren B Reed')],
  [x('Hector Lane','','Midfielder','Collins Cross FC','','Scouting Register'),x('Hector Lane','','Midfielder','Collins Cross FC','','Scouting Register')],
  [x('Reed Archer','1999-08-08'),x('Archer Reed','2000-08-08')]
];
export const HOLDOUT_COUNTS = {same: same.length, different: different.length};
export function makeHoldoutDataset(){
  const records=[], truthByUid=new Map();
  for(const [type,cases] of [['S',same],['N',different]]){
    cases.forEach((caseRows,caseIndex)=>caseRows.forEach((entry,rowIndex)=>{
      const source=entry.source || ['Scouting Register','Match Records','Trialist Log'][rowIndex%3];
      const source_id=`H-${type}-${caseIndex+1}-${rowIndex+1}`;
      const uid=`${source}:${source_id}`;
      const {source: _,...data}=entry;
      records.push({uid,source,source_id,...data});
      truthByUid.set(uid,type==='S'?`HS-${caseIndex}`:`HN-${caseIndex}-${rowIndex}`);
    }));
  }
  return {records,truthByUid};
}