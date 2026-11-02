/** All club, player and scouting information in this file is fictional. */
const club = 'Collins Cross FC';

const entries = {
  'Scouting Register': [
    ['S-001', 'Joseph Taylor', '1999-02-14', 'Central midfield'],
    ['S-002', 'Daniel Mercer', '2001-10-05', 'Winger'],
    ['S-003', 'Aiden Brooks', '2000-07-18', 'Defender'],
    ['S-004', 'Oliver Bennett', '1998-04-22', 'Forward'],
    ['S-005', 'Alex Morgan', '2002-09-09', 'Midfielder'],
    ['S-006', 'Sam Wilson', '1999-03-11', 'Goalkeeper'],
    ['S-007', 'Harry Price', '2004-05-23', 'Full-back'],
    ['S-008', 'Aaron Hughes', '1997-08-16', 'Striker'],
    ['S-009', 'Jack Reynolds', '2003-01-13', 'Midfielder'],
    ['S-010', 'Ben Carter', '1996-06-02', 'Defender'],
    ['S-011', 'Adam Wright', '1999-07-07', 'Midfielder'],
    ['S-012', 'Daniel Collins', '2000-11-02', 'Midfielder']
  ],
  'Match Records': [
    ['M-101', 'Joe Taylor', '1999-02-14', 'Midfielder'],
    ['M-102', 'Dan Mercer', '2001-10-05', 'Winger'],
    ['M-103', 'Aidan Brooks', '2000-07-18', 'Centre-back'],
    ['M-104', 'Oliver Bennett', '1998-04-22', 'Striker'],
    // Intentionally different DOB from S-005: same-name collision must stay separate.
    ['M-105', 'Alex Morgan', '2001-09-09', 'Midfielder'],
    ['M-106', 'Samuel Wilson', '1999-03-11', 'Keeper'],
    ['M-107', 'Harry Price', '', 'Full-back'],
    ['M-108', 'Ben Carter', '1996-06-02', 'Centre-back'],
    ['M-109', 'Thomas Fletcher', '2001-06-20', 'Forward']
  ],
  'Trialist Log': [
    ['T-201', 'Joseph Taylor', '1999-02-14', 'Central midfield'],
    ['T-202', 'Danny Mercer', '2001-10-05', 'Winger'],
    ['T-203', 'Aidan Brooks', '2000-07-18', 'Defender'],
    ['T-204', 'Alexander Morgan', '2002-09-09', 'Midfielder'],
    ['T-205', 'Sammy Wilson', '', 'Goalkeeper'],
    ['T-206', 'Harry Price', '2004-05-23', 'Full back'],
    ['T-207', 'Aaron Hughes', '1997-08-16', 'Striker'],
    ['T-208', 'Isaac Ford', '2003-06-26', 'Midfielder'],
    ['T-209', 'Alex Morgan', '2001-09-09', 'Defender']
  ]
};

export const DEMO_RECORDS = Object.entries(entries).flatMap(([source, records]) => records.map(([source_id, name, dob, position]) => ({
  uid: `${source}:${source_id}`, source, source_id, name, dob, position, club, external_id: ''
})));

export const STARTING_SOURCES = Object.keys(entries);