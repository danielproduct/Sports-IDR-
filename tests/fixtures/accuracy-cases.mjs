/**
 * Hand-labelled, fictional adult-player identities for measuring link proposals.
 * Labels are independent of the IDR engine. All people and IDs are invented.
 * A linked case has two or more rows for one identity. A distinct case has
 * records belonging to different identities despite potentially similar names.
 * This dataset is a deliberately difficult synthetic challenge, NOT real-world
 * evidence of predictive accuracy and NOT a statistically representative sample.
 */
const r = (name, dob = '', position = 'Midfielder', club = 'Collins Cross FC', external_id = '', source = '') =>
  ({ name, dob, position, club, external_id, source });

const samePerson = [
  ['exact', r('Priya Narang', '1998-03-20'), r('Priya Narang', '1998-03-20')],
  ['joe-alias', r('Joseph Marlowe', '2000-01-07'), r('Joe Marlowe', '2000-01-07')],
  ['danny-alias', r('Daniel Wicks', '1999-09-12'), r('Danny Wicks', '1999-09-12')],
  ['aidan-spelling', r('Aiden Hart', '2001-07-18'), r('Aidan Hart', '2001-07-18')],
  ['sammy-alias', r('Samuel Ellis', '1998-11-02'), r('Sammy Ellis', '1998-11-02')],
  ['alex-alias', r('Alexander Keane', '2000-04-21'), r('Alex Keane', '2000-04-21')],
  ['ollie-alias', r('Oliver Byrne', '1997-10-10'), r('Ollie Byrne', '1997-10-10')],
  ['tom-alias', r('Thomas Fraser', '2002-06-16'), r('Tom Fraser', '2002-06-16')],
  ['accent-first', r('Jos\u00e9 Alvarez', '1996-08-17'), r('Jose Alvarez', '1996-08-17')],
  ['apostrophe', r("Eva O'Connor", '2001-10-26'), r('Eva OConnor', '2001-10-26')],
  ['hyphenated', r('Lucy Moore-Smith', '2003-05-17'), r('Lucy Moore Smith', '2003-05-17')],
  ['middle-name', r('Mary Jane Cross', '1999-12-01'), r('Mary Cross', '1999-12-01')],
  ['surname-typo', r('Ethan Thompson', '2002-09-11'), r('Ethan Thomson', '2002-09-11')],
  ['first-typo', r('Emily Carter', '1997-06-15'), r('Emilly Carter', '1997-06-15')],
  ['different-position', r('Noah Sullivan', '1998-03-11', 'Goalkeeper'), r('Noah Sullivan', '1998-03-11', 'Striker')],
  ['different-club', r('Sophie Harding', '2000-04-04', 'Midfielder', 'Oldfield FC'), r('Sophie Harding', '2000-04-04', 'Defender', 'Collins Cross FC')],
  ['one-missing-dob', r('Benjamin Ward', '2001-01-18'), r('Ben Ward')],
  ['both-missing-dob', r('Arthur Bell'), r('Arthur Bell')],
  ['compound-first', r('Jean-Pierre Dupont', '2001-11-12'), r('Jean Pierre Dupont', '2001-11-12')],
  ['accent-first-2', r('Chlo\u00e9 Bennett', '1999-07-29'), r('Chloe Bennett', '1999-07-29')],
  ['prefix-surname', r('Zara McDonald', '1998-07-23'), r('Zara MacDonald', '1998-07-23')],
  ['initial-first', r('James McCarthy', '2000-05-10'), r('J. McCarthy', '2000-05-10')],
  ['initial-first-2', r('Mia Patel', '2002-02-04'), r('M Patel', '2002-02-04')],
  ['changed-surname', r('Grace Murphy', '1998-02-08', 'Midfielder', 'Collins Cross FC', 'GLOBAL-9001'), r("Grace O'Neil", '1998-02-08', 'Midfielder', 'Collins Cross FC', 'GLOBAL-9001')],
  ['name-reversed', r('Miller Ryan', '2000-09-21'), r('Ryan Miller', '2000-09-21')],
  ['unlisted-rob-alias', r('Roberto Vega', '1997-04-09'), r('Rob Vega', '1997-04-09')],
  ['unlisted-mo-alias', r('Mohammed Khan', '1999-07-10'), r('Mo Khan', '1999-07-10')],
  ['unlisted-will-alias', r('William Cooper', '2001-12-23'), r('Will Cooper', '2001-12-23')],
  ['unlisted-gabi-alias', r('Gabrielle Taylor', '1996-04-12'), r('Gabi Taylor', '1996-04-12')],
  ['unlisted-fran-alias', r('Francesca White', '1999-01-23'), r('Fran White', '1999-01-23')],
  ['unlisted-ted-alias', r('Edward Pritchard', '1998-07-14'), r('Ted Pritchard', '1998-07-14')],
  ['unlisted-katie-alias', r('Katherine Davies', '2000-10-10'), r('Katie Davies', '2000-10-10')],
  ['unlisted-matt-alias', r('Matthew Dean', '1997-05-25'), r('Matt Dean', '1997-05-25')],
  ['unlisted-seb-alias', r('Sebastian Cole', '2000-05-26'), r('Seb Cole', '2000-05-26')],
  ['unlisted-meg-alias', r('Megan Kelly', '2000-03-21'), r('Meg Kelly', '2000-03-21')],
  ['unlisted-alex-alias', r('Alexandra Watts', '2001-09-11'), r('Alex Watts', '2001-09-11')],
  ['unlisted-billy-alias', r('William Pope', '1998-11-11', 'Midfielder', 'Collins Cross FC', 'GLOBAL-9011'), r('Billy Pope', '1998-11-11', 'Midfielder', 'Collins Cross FC', 'GLOBAL-9011')],
  ['unlisted-chris-alias', r('Christopher Frost', '2000-08-29'), r('Chris Frost', '2000-08-29')],
  ['same-source-duplicate', r('Cameron Dale', '2003-09-10', 'Forward', 'Collins Cross FC', '', 'Scouting Register'), r('Cameron Dale', '2003-09-10', 'Forward', 'Collins Cross FC', '', 'Scouting Register')],
  ['same-source-name-variant', r('Daniel Rivers', '2002-03-03', 'Midfielder', 'Collins Cross FC', '', 'Scouting Register'), r('Dan Rivers', '2002-03-03', 'Midfielder', 'Collins Cross FC', '', 'Scouting Register')],
  ['triple-linked', r('Joseph Grantham', '1999-05-05'), r('Joe Grantham', '1999-05-05'), r('Joey Grantham', '1999-05-05', 'Midfielder', 'Collins Cross FC', '', 'Trialist Log')],
  ['missing-dob-three', r('Harry Miles', '2002-01-12'), r('Harry Miles'), r('Harry Miles', '2002-01-12', 'Defender', 'Collins Cross FC', '', 'Trialist Log')],
  ['identical-ext-dob', r('Leila Cooper', '2001-06-02', 'Midfielder', 'Collins Cross FC', 'GLOBAL-504'), r('Leila Cooper', '2001-06-02', 'Midfielder', 'Collins Cross FC', 'GLOBAL-504')]
];

const differentPeople = [
  ['different-dob', r('John Smith', '1990-01-01'), r('John Smith', '1993-01-01')],
  ['one-dob-missing', r('Jamie Nolan', '2002-03-04'), r('Jamie Nolan')],
  ['both-dob-missing', r('Charlie Quinn'), r('Charlie Quinn')],
  ['same-name-dob-adversarial', r('Alfie Grant', '1999-03-30'), r('Alfie Grant', '1999-03-30')],
  ['same-name-ext-conflict', r('Peter Scott', '', 'Midfielder', 'Collins Cross FC', 'GLOBAL-11'), r('Peter Scott', '', 'Midfielder', 'Collins Cross FC', 'GLOBAL-12')],
  ['similar-first-missing-dob', r('Sofia James'), r('Sonia James')],
  ['similar-first-albert', r('Albert Shaw'), r('Alberto Shaw')],
  ['similar-first-alan', r('Alan Cooper'), r('Alana Cooper')],
  ['similar-last', r('Maria Porter'), r('Maria Potter')],
  ['name-match-different-club', r('Henry Walsh', '', 'Goalkeeper', 'Oldfield FC'), r('Henry Walsh', '', 'Forward', 'Southdale FC')],
  ['first-different', r('Michael Owen'), r('Mickey Owen')],
  ['last-different', r('Jamie Lee'), r('Jamie Lea')],
  ['similar-first-variants', r('Alexandra Cross'), r('Alexander Cross')],
  ['same-dob-similar-name', r('Taylor Ford', '2001-01-31'), r('Tyler Ford', '2001-01-31')],
  ['same-dob-ext-conflict', r('Nina Brown', '2000-08-01', 'Midfielder', 'Collins Cross FC', 'GLOBAL-31'), r('Nina Brown', '2000-08-01', 'Midfielder', 'Collins Cross FC', 'GLOBAL-32')],
  ['different-dob-similar-name', r('Kevin Price', '1999-08-10'), r('Kevyn Price', '2001-08-10')],
  ['same-name-both-missing-other', r('Jordan Blake'), r('Jordan Blake')],
  ['same-surname-first-typo', r('Louise Hall'), r('Louisa Hall')],
  ['same-name-one-dob-missing-2', r('Dylan Webb', '1998-12-01'), r('Dylan Webb')],
  ['very-similar-names', r('Mason Holmes'), r('Mayson Holmes')],
  ['external-id-conflict', r('Brandon Lee', '', 'Forward', 'Collins Cross FC', 'GLOBAL-55'), r('Brandon Lee', '', 'Forward', 'Collins Cross FC', 'GLOBAL-56')],
  ['middle-initial-same-name', r('Aaron T Parker'), r('Aaron B Parker')],
  ['surname-hyphen-shared', r('Iris Green-Smith'), r('Iris Blue-Smith')],
  ['same-source-distinct', r('Theo Harper', '1999-06-05', 'Midfielder', 'Collins Cross FC', '', 'Scouting Register'), r('Theo Harper', '2000-06-05', 'Midfielder', 'Collins Cross FC', '', 'Scouting Register')]
];

export const ACCURACY_CASES = { samePerson, differentPeople };

export function makeAccuracyDataset() {
  const records = [];
  const truthByUid = new Map();
  const scenarioByPairKey = new Map();
  const sources = ['Scouting Register', 'Match Records', 'Trialist Log'];

  const addCase = (type, entry, caseIndex) => {
    const [tag, ...rows] = entry;
    const batch = [];
    rows.forEach((input, rowIndex) => {
      const source = input.source || sources[rowIndex % sources.length];
      const source_id = `${type === 'same' ? 'P' : 'N'}-${String(caseIndex + 1).padStart(3, '0')}-${rowIndex + 1}`;
      const uid = `${source}:${source_id}`;
      const { source: _, ...fields } = input;
      records.push({ uid, source, source_id, ...fields });
      truthByUid.set(uid, type === 'same' ? `P-${caseIndex + 1}` : `N-${caseIndex + 1}-${rowIndex + 1}`);
      batch.push(uid);
    });
    for (let a = 0; a < batch.length; a++) {
      for (let b = a + 1; b < batch.length; b++) {
        scenarioByPairKey.set([batch[a], batch[b]].sort().join('|'), { tag, expectedSame: type === 'same' });
      }
    }
  };
  samePerson.forEach((entry, i) => addCase('same', entry, i));
  differentPeople.forEach((entry, i) => addCase('distinct', entry, i));

  return { records, truthByUid, scenarioByPairKey };
}