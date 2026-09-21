"""Batch 22 — devolved legislatures, everyday services and a few gaps.

Brings the bank to 1,080 questions, exactly 45 mock tests of 24.
"""

QUESTIONS = [
    (
        "Government and Law",
        "How many members does the Senedd have following the 2026 election?",
        ["96", "60", "129", "40"],
        "The Senedd, the Welsh Parliament in Cardiff Bay, grew from 60 members to 96 at the "
        "election held in May 2026, the largest change to its make-up since it was created in "
        "1999. The increase was made by the Senedd Cymru (Members and Elections) Act 2024, on the "
        "argument that 60 members were too few to scrutinise a government whose powers had grown "
        "through successive devolution settlements, particularly over health, education, housing "
        "and taxation. Members are known as Members of the Senedd, or MSs, and together they "
        "choose a First Minister who leads the Welsh Government. Each nation of the UK outside "
        "England has its own legislature, and they differ in size, in the way members are elected "
        "and in the range of matters they control.",
    ),
    (
        "Government and Law",
        "Which voting system has been used for Senedd elections since 2026?",
        [
            "A closed-list system of proportional representation",
            "First past the post in single-member seats",
            "The single transferable vote in multi-member seats",
            "A run-off between the two leading candidates",
        ],
        "Wales moved to a closed-list form of proportional representation for the 2026 election. "
        "The country is divided into sixteen constituencies, each returning six members, and each "
        "party puts forward an ordered list of candidates. Voters choose a party rather than an "
        "individual, and seats in each constituency are shared out in proportion to the votes "
        "cast, so a party winning roughly a third of the vote can expect roughly two of the six "
        "seats. This replaced the additional member system used from 1999 to 2021, under which "
        "voters had two votes, one for a constituency member and one for a regional list. The "
        "four parts of the UK use several different systems, so the way a vote translates into "
        "seats depends on which election is being held.",
    ),
    (
        "Government and Law",
        "What are members of the Welsh Parliament called?",
        [
            "Members of the Senedd, or MSs",
            "Members of the Legislative Assembly, or MLAs",
            "Members of the Scottish Parliament, or MSPs",
            "Members of Parliament, or MPs",
        ],
        "Members of the Welsh Parliament are Members of the Senedd, abbreviated to MS, a title "
        "adopted in 2020 when the institution was renamed Senedd Cymru, or the Welsh Parliament, "
        "in place of the National Assembly for Wales. Before that they were Assembly Members, or "
        "AMs. The titles differ across the UK: Scotland elects MSPs to the Scottish Parliament, "
        "Northern Ireland elects MLAs to its Assembly, and the whole of the UK elects MPs to the "
        "House of Commons at Westminster. A person living in Wales is therefore represented by "
        "both an MS in Cardiff and an MP in London, each dealing with different matters. Knowing "
        "which representative handles which subject is the practical point behind the titles.",
    ),
    (
        "Government and Law",
        "How many Members of the Scottish Parliament are there?",
        ["129", "96", "90", "650"],
        "The Scottish Parliament at Holyrood in Edinburgh has 129 members, known as MSPs. "
        "Seventy-three are elected for individual constituencies and the remaining fifty-six are "
        "elected from eight regions, seven from each, which makes the overall result roughly "
        "proportional to the votes cast. The Parliament first met in 1999 and has power over "
        "matters including health, education, justice, policing, housing, the environment and "
        "parts of taxation and welfare, while defence, foreign affairs and immigration remain "
        "with the UK Parliament. MSPs choose a First Minister, who appoints the Scottish "
        "Government. Every voter in Scotland has more than one MSP: one for the constituency and "
        "seven for the wider region, and any of them may be approached for help.",
    ),
    (
        "Government and Law",
        "Which voting system is used to elect the Scottish Parliament?",
        [
            "The additional member system",
            "First past the post alone",
            "The single transferable vote alone",
            "A closed party list for the whole country",
        ],
        "Scotland uses the additional member system. Each voter has two votes: one for a "
        "constituency member elected by first past the post, and one for a party list in a wider "
        "region. The regional seats are then allocated so that each party's total share of seats "
        "in that region comes closer to its share of the votes, topping up parties that won fewer "
        "constituencies than their support would suggest. The result is a parliament in which no "
        "single party often holds a majority, so coalitions and minority governments are common. "
        "The same system was used in Wales until 2021, and a similar mixed approach operates for "
        "the London Assembly, while Northern Ireland and Scottish local councils use the single "
        "transferable vote instead.",
    ),
    (
        "Government and Law",
        "How many members sit in the Northern Ireland Assembly?",
        ["90", "108", "129", "60"],
        "The Northern Ireland Assembly at Stormont has 90 members, called MLAs, five returned "
        "from each of the eighteen parliamentary constituencies. The number was cut from 108 for "
        "the 2017 election, when each constituency dropped from six members to five. The Assembly "
        "was established under the Belfast, or Good Friday, Agreement of 1998 and legislates on "
        "transferred matters such as health, education, agriculture and justice. Its executive is "
        "shared between unionist and nationalist parties, with a First Minister and deputy First "
        "Minister holding equal powers, and key decisions can require cross-community support. "
        "The Assembly has been suspended for long periods when the parties could not agree, "
        "during which civil servants continued to run departments without ministers.",
    ),
    (
        "Government and Law",
        "Which voting system is used for elections to the Northern Ireland Assembly?",
        [
            "The single transferable vote",
            "First past the post",
            "The additional member system",
            "A closed party list",
        ],
        "Northern Ireland elects its Assembly by the single transferable vote. Voters number the "
        "candidates in order of preference, and candidates who reach a quota are elected, with "
        "surplus votes and the votes of eliminated candidates passed on according to those "
        "preferences until all five seats in a constituency are filled. The system was chosen to "
        "give fair representation to both communities and to smaller parties, and it lets voters "
        "rank candidates across party lines. The same method is used for local council elections "
        "in Northern Ireland and Scotland. Elsewhere in the UK, members of the House of Commons "
        "are elected by first past the post, in which the candidate with the most votes in a "
        "constituency wins even without an overall majority.",
    ),
    (
        "Government and Law",
        "Which members lost the right to sit in the House of Lords under an Act of 2026?",
        [
            "Hereditary peers",
            "Life peers appointed before 1999",
            "The Lords Spiritual",
            "Former Prime Ministers",
        ],
        "The reform of 1999 removed most hereditary peers from the House of Lords but allowed "
        "ninety-two to remain as a temporary compromise. An Act passed in 2026 ended that "
        "arrangement, so membership by inheritance came to an end after more than seven "
        "centuries. The House now consists of life peers, appointed for their experience in "
        "fields such as medicine, science, business, the armed forces and public service, "
        "together with twenty-six senior Church of England bishops who sit as the Lords "
        "Spiritual. Appointments are made by the King on the advice of the Prime Minister, with "
        "some names put forward by other party leaders and some recommended independently. The "
        "Lords revises legislation and scrutinises government, but cannot ultimately block the "
        "elected Commons.",
    ),
    (
        "Government and Law",
        "Which court hears most civil claims, such as unpaid debts and compensation, in England and Wales?",
        [
            "The county court",
            "The magistrates' court",
            "The Crown Court",
            "The Supreme Court",
        ],
        "Civil law covers disputes between people or organisations rather than crimes, and in "
        "England and Wales most of those disputes are heard in the county court: unpaid debts, "
        "faulty goods and services, compensation for injury, disputes between landlords and "
        "tenants, and many family matters. A judge decides the case and there is normally no "
        "jury. Small claims, usually those under a few thousand pounds, follow a simpler and "
        "cheaper procedure designed to be used without a solicitor. The most substantial or "
        "complex civil cases go to the High Court instead. Criminal cases take a different route, "
        "through the magistrates' court and the Crown Court, and the Supreme Court hears only "
        "appeals raising points of law of general importance.",
    ),
    (
        "Government and Law",
        "In which elections can 16- and 17-year-olds already vote?",
        [
            "Scottish Parliament and Senedd elections",
            "UK general elections everywhere in the UK",
            "Northern Ireland Assembly elections only",
            "No elections anywhere in the UK",
        ],
        "Scotland lowered the voting age to 16 for the independence referendum of 2014 and then "
        "kept it for Scottish Parliament and Scottish council elections. Wales followed, so "
        "16- and 17-year-olds have been able to vote in Senedd and Welsh council elections since "
        "2021. Those decisions were taken by the devolved legislatures, which control their own "
        "franchise, while the rules for UK general elections are set at Westminster and have "
        "required voters to be at least 18. A young person in Scotland or Wales may therefore be "
        "on the register for one election but not another. Registering to vote is a separate step "
        "from being eligible, and people can register from the age of 16 across the UK.",
    ),
    (
        "Government and Law",
        "Which court deals with most criminal and civil cases in Scotland?",
        [
            "The sheriff court",
            "The magistrates' court",
            "The county court",
            "The Crown Court",
        ],
        "Scotland has its own legal system and its own courts. The sheriff court hears the great "
        "majority of both criminal and civil business, from theft and assault to debt, damages "
        "and family matters, with a sheriff sitting alone or, for more serious crimes, with a "
        "jury of fifteen. The most serious crimes, such as murder and rape, go to the High Court "
        "of Justiciary, and important civil cases and appeals go to the Court of Session in "
        "Edinburgh. Minor offences are dealt with in justice of the peace courts. The equivalent "
        "courts in England and Wales are the magistrates' court and Crown Court for crime, and "
        "the county court and High Court for civil claims.",
    ),
    (
        "Modern Society",
        "What is usually the first step for someone who needs to see a doctor in the UK?",
        [
            "Register with a local GP surgery",
            "Go straight to a hospital accident and emergency department",
            "Apply to the Department of Health for a referral",
            "Pay a private consultation fee in advance",
        ],
        "General practitioners are the main route into the health service, so a new resident "
        "should register with a GP surgery near where they live, usually by completing a form "
        "with basic details. Registration is free and does not normally require proof of address "
        "or immigration status, although a practice may ask for identification. The GP treats "
        "everyday illnesses, manages long-term conditions, prescribes medicines and refers "
        "patients to hospital specialists when needed. Accident and emergency departments are for "
        "serious injuries and life-threatening conditions only, and using them for minor problems "
        "adds to waiting times for everyone. Pharmacies give free advice on common complaints, "
        "and out-of-hours services cover evenings and weekends when a surgery is closed.",
    ),
    (
        "Modern Society",
        "What is the NHS 111 service used for?",
        [
            "Urgent medical advice when the problem is not an emergency",
            "Reporting a crime that is not in progress",
            "Booking routine dental check-ups",
            "Ordering repeat prescriptions from a pharmacy",
        ],
        "NHS 111 is a free telephone and online service in England, Scotland and Wales for people "
        "who need medical help quickly but whose situation is not life-threatening. Trained staff "
        "ask a series of questions and then advise on what to do: treat the problem at home, see "
        "a pharmacist, make an urgent appointment with a GP, or attend an out-of-hours centre or "
        "hospital. Where necessary they can arrange an ambulance. The service runs at all hours "
        "and is particularly useful at night, at weekends and when someone is away from their own "
        "surgery. It is not a substitute for 999, which should be dialled for chest pain, severe "
        "bleeding, breathing difficulties, loss of consciousness or any other emergency.",
    ),
    (
        "Modern Society",
        "Which telephone number is used to contact the police about a matter that is not an emergency?",
        ["101", "111", "112", "999"],
        "The 101 number connects callers to their local police force for matters that need "
        "attention but where nobody is in immediate danger and no crime is in progress: reporting "
        "a stolen bicycle, giving information about a crime that happened earlier, asking about "
        "an existing case or raising a concern about antisocial behaviour. Many forces also take "
        "such reports online. The 999 number, or 112, is reserved for emergencies, when a crime "
        "is happening, a suspect is nearby or someone is at risk of harm. Keeping non-urgent "
        "calls off the emergency line helps operators reach people in danger faster. NHS 111 is a "
        "separate service for health advice, and misusing any emergency number is an offence.",
    ),
    (
        "Modern Society",
        "What is an apprenticeship?",
        [
            "Paid employment combined with training towards a recognised qualification",
            "A period of unpaid work experience lasting a few weeks",
            "A university degree taken entirely by distance learning",
            "A government payment made to people who are out of work",
        ],
        "An apprentice is an employee who is paid a wage while learning a trade or profession, "
        "spending most of the week working and the rest studying towards a nationally recognised "
        "qualification. Apprenticeships exist at many levels, from entry routes for school leavers "
        "to degree apprenticeships taken alongside a full job, and they cover engineering, "
        "construction, accountancy, health care, digital work and much else. There is a minimum "
        "wage rate specific to apprentices, and employers must give paid time for the training "
        "element. They offer a way into skilled work without the tuition fees of a full-time "
        "degree, and the schemes are run slightly differently in England, Scotland, Wales and "
        "Northern Ireland.",
    ),
    (
        "Modern Society",
        "Why do households in the UK separate paper, glass and plastic from other rubbish?",
        [
            "So that those materials can be collected for recycling",
            "Because general waste collections have been stopped",
            "So that the council can weigh each household's rubbish",
            "Because it is required before a house can be sold",
        ],
        "Local councils provide separate bins, boxes or bags for materials that can be recycled, "
        "and collect them on a published timetable that varies from area to area. Sorting paper, "
        "card, glass, cans and many plastics keeps them out of landfill and turns them back into "
        "new products, which saves raw materials and energy. Many areas also collect food and "
        "garden waste for composting, and councils run household waste recycling centres for "
        "bulky items, electrical goods and garden rubble. Putting the wrong things in a recycling "
        "bin can mean a whole load is rejected, so councils publish lists of what they accept. "
        "Dumping waste illegally, known as fly-tipping, is a criminal offence carrying heavy "
        "fines.",
    ),
    (
        "Modern Society",
        "What must a landlord in England fit on every storey of a rented home used as living accommodation?",
        [
            "A working smoke alarm",
            "A carbon monoxide alarm in every room",
            "A sprinkler system",
            "A second means of escape",
        ],
        "Regulations require landlords in England to provide at least one working smoke alarm on "
        "each storey of a rented property that has living accommodation, and to make sure the "
        "alarms work at the start of every new tenancy. A carbon monoxide alarm is also required "
        "in any room containing a fixed appliance that burns fuel, such as a wood burner, coal "
        "fire or gas boiler, though not for a gas cooker. Tenants are expected to test the alarms "
        "during the tenancy and report faults, and the landlord must repair or replace them. "
        "Similar rules apply across the UK. Many fire and rescue services will visit a home free "
        "of charge to give safety advice and fit alarms.",
    ),
    (
        "What is the UK",
        "Which nation of the United Kingdom is the largest by land area?",
        ["England", "Scotland", "Wales", "Northern Ireland"],
        "England covers about 130,000 square kilometres, making it the largest of the four "
        "nations by area as well as much the largest by population. Scotland is next at roughly "
        "78,000 square kilometres, although its many islands and long sea coast make it feel "
        "larger still, followed by Wales at about 21,000 and Northern Ireland at about 14,000. "
        "Population is spread very differently from land: England holds around four fifths of the "
        "UK's people in well under half of its territory, while large parts of the Scottish "
        "Highlands are among the emptiest country in Europe. Knowing the rough size and position "
        "of each nation helps make sense of devolution, transport and the distribution of "
        "industry and farming.",
    ),
    (
        "What is the UK",
        "In which part of the UK is Scottish Gaelic mainly spoken?",
        [
            "The Highlands and Islands of Scotland",
            "The Scottish Borders",
            "North and west Wales",
            "The far south-west of England",
        ],
        "Scottish Gaelic is a Celtic language descended from the speech of settlers who crossed "
        "from Ireland, and it survives chiefly in the Highlands and the Western Isles, where road "
        "signs, schools and broadcasting use it alongside English. The number of speakers is "
        "small, in the tens of thousands, but it has official recognition in Scotland and public "
        "bodies produce Gaelic language plans. It is a separate language from Scots, the Germanic "
        "speech of the Lowlands, and from Irish, though closely related to the latter. Welsh is "
        "far more widely spoken, particularly in north and west Wales, where it is an official "
        "language alongside English, and Irish and Ulster Scots have recognition in Northern "
        "Ireland.",
    ),
    (
        "What is the UK",
        "The Cornish language is associated with which part of the UK?",
        ["Cornwall", "Cumbria", "County Durham", "The Isle of Wight"],
        "Cornish is a Celtic language of the south-west peninsula of England, related to Welsh "
        "and Breton. It died out as an everyday community language in the eighteenth century but "
        "has been revived by enthusiasts since the early twentieth, and it now has a few hundred "
        "fluent speakers, classes for learners, place-name research and some use on signs and in "
        "public life. It was formally recognised as a minority language in 2002. Its survival "
        "shows the Celtic layer that underlies much of the geography of Britain, seen in the "
        "names of rivers, hills and towns far beyond the areas where Celtic languages are still "
        "spoken. The UK has no single official language established by law.",
    ),
    (
        "Values and Principles",
        "What is expected of someone who strongly disagrees with a particular law?",
        [
            "To obey it while campaigning by lawful means to change it",
            "To ignore it until Parliament repeals it",
            "To obey it only if a court has confirmed that it applies to them",
            "To leave the country until the law is changed",
        ],
        "Respect for the rule of law means that laws apply to everyone, including those who think "
        "a particular law is wrong. The remedy for a bad law is to change it, and the ways of "
        "doing so are open to all: voting, writing to an MP or other elected representative, "
        "joining a party or campaign group, signing or starting a petition, giving evidence to a "
        "committee, or taking part in lawful protest. Courts can also be asked to rule on whether "
        "a law has been applied properly. What is not acceptable is deciding individually which "
        "laws to obey, because the protection the law offers everyone depends on it binding "
        "everyone. Many rights in Britain were won by exactly this kind of lawful campaigning.",
    ),
    (
        "Values and Principles",
        "Why does the official guidance encourage people settling in the UK to learn English?",
        [
            "Because it helps them work, use services and take part in community life",
            "Because other languages may not be spoken at home",
            "Because it is the only language allowed in public offices",
            "Because employers are forbidden to hire non-English speakers",
        ],
        "Speaking English, or Welsh or Scottish Gaelic where those are used, is treated as central "
        "to settling successfully. It opens up work, lets people deal with a doctor, a school, a "
        "landlord or a council without an interpreter, makes it possible to follow the news and "
        "join in local life, and helps children with their education. There is also a formal "
        "side: applicants for settlement and citizenship generally have to show a set standard of "
        "spoken English as well as passing the Life in the UK test. Free or subsidised classes in "
        "English for speakers of other languages are widely available through colleges, libraries "
        "and community groups. Nothing in this prevents people speaking other languages at home "
        "or in their communities.",
    ),
]
