export const RESPONSE_SCALE: Record<string, number> = {
  "Strongly Disagree": 1,
  "Disagree": 2,
  "Neutral": 3,
  "Agree": 4,
  "Strongly Agree": 5,
};

export const LAYER_1_QUESTIONS: Record<string, string[]> = {
  "Linguistic": [
    "I enjoy writing essays, stories, or journal entries for fun.",
    "I find it easy to explain complex topics in simple terms.",
    "I actively participate in debates, discussions, or public speaking.",
    "I enjoy reading and analyzing books, research papers, or blogs.",
    "I like to express my ideas clearly through written or spoken communication.",
  ],
  "Logical-Mathematical Intelligence": [
    "I enjoy solving logical puzzles, riddles, or brain teasers.",
    "I analyze data, statistics, or numerical trends to make decisions.",
    "I like working on research projects that involve problem-solving.",
    "I enjoy subjects like math, coding, finance, or science.",
    "I easily identify patterns and relationships in data or concepts.",
  ],
  "Interpersonal Intelligence": [
    "I enjoy working in teams and collaborating with peers on projects.",
    "I am good at resolving conflicts between friends or classmates.",
    "I often help others understand concepts by explaining them in different ways.",
    "I enjoy networking, meeting new people, and forming connections.",
    "I understand and respond well to people’s emotions and perspectives.",
  ],
  "Intrapersonal Intelligence": [
    "I regularly reflect on my personal strengths and weaknesses.",
    "I set clear personal and academic goals for myself.",
    "I stay motivated and disciplined even when studying independently.",
    "I understand my emotions and how they affect my decision-making.",
    "I choose career paths based on my interests, values, and long-term aspirations.",
  ],
  "Naturalistic Intelligence": [
    "I enjoy studying environmental topics like sustainability, ecology, or agriculture.",
    "I like spending time in nature and observing patterns in the environment.",
    "I notice and appreciate details in my surroundings that others often overlook.",
    "I advocate for environmental and sustainability initiatives in my college.",
    "I connect academic subjects with real-world applications in nature and science.",
  ],
  "Bodily-Kinesthetic Intelligence": [
    "I enjoy physical activities like sports, dance, or acting.",
    "I learn better by doing rather than just reading or listening.",
    "I like building things with my hands or tools.",
    "I have good hand-eye coordination and body control.",
    "I express myself physically (e.g., gestures, movement).",
  ],
  "Musical Intelligence": [
    "I can identify or reproduce musical patterns easily.",
    "I enjoy listening to or creating music.",
    "I use rhythm or music to memorize concepts.",
    "I can differentiate tones, pitches, and instruments.",
    "I often notice background music or ambient sounds.",
  ],
  "Visual-Spatial Intelligence": [
    "I enjoy drawing, painting, or visual designing.",
    "I can visualize objects from different angles in my mind.",
    "I prefer visual aids like diagrams, charts, or videos.",
    "I am good at navigating or reading maps.",
    "I often think in pictures rather than words.",
  ],
  "Cognitive Styles": [
    "I prefer visual materials (diagrams, flowcharts) when learning new things.",
    "I tend to think in words and prefer reading or writing to learn.",
    "I like learning by doing and engaging in hands-on tasks.",
  ],
};

export const LAYER_2_QUESTIONS: Record<string, string[]> = {
  MBTI: [
    "I get energized by spending time alone (I) vs with others (E).",
    "I prefer focusing on facts (S) vs big picture ideas (N).",
    "I prioritize logic and consistency (T) vs empathy and values (F).",
    "I prefer planned and organized (J) vs flexible and spontaneous (P).",
  ],
  "Big Five - Openness": [
    "I enjoy trying new and different activities.",
    "I am imaginative and full of ideas.",
    "I appreciate art, music, and literature.",
  ],
  "Big Five - Conscientiousness": [
    "I like to keep things organized and tidy.",
    "I follow through with tasks and responsibilities.",
  ],
  "Big Five - Extraversion": [
    "I feel comfortable in social situations.",
    "I enjoy being the center of attention.",
  ],
  "Big Five - Agreeableness": [
    "I am considerate and kind to almost everyone.",
    "I try to see things from others’ perspectives.",
  ],
  "Big Five - Neuroticism": [
    "I get stressed or anxious easily.",
    "I experience frequent mood changes.",
  ],
  "SDT - Autonomy": [
    "I feel free to choose how to approach my work or study.",
    "I enjoy tasks more when I have control over them.",
  ],
  "SDT - Competence": [
    "I feel capable and effective in what I do.",
    "I take pride in mastering new skills or challenges.",
  ],
  "SDT - Relatedness": [
    "I feel connected and close to people around me.",
    "I value meaningful relationships in my life.",
  ],
};

export const LAYER_3_QUESTIONS: Record<string, string[]> = {
  "Numerical Aptitude": [
    "I am comfortable working with numbers and data.",
    "I can solve arithmetic and algebraic problems easily.",
    "I enjoy tasks involving statistics, accounting, or finance.",
  ],
  "Verbal Aptitude": [
    "I understand and use new vocabulary quickly.",
    "I can comprehend and analyze written passages.",
    "I enjoy word-based games and language puzzles.",
  ],
  "Abstract Reasoning": [
    "I can spot logical patterns in unfamiliar problems.",
    "I can mentally manipulate shapes and figures.",
    "I solve visual puzzles and reasoning questions with ease.",
  ],
  "Technical Skills": [
    "I have experience with software/tools relevant to my field.",
    "I can troubleshoot or learn new technical skills quickly.",
    "I understand technical manuals, processes, or systems.",
  ],
  "Creative/Design Skills": [
    "I can generate original ideas and solutions.",
    "I am skilled at sketching, designing, or multimedia work.",
    "I enjoy innovating in visual or artistic formats.",
  ],
  "Communication Skills": [
    "I express my ideas clearly in speaking or writing.",
    "I adapt my message to suit the audience.",
    "I am persuasive and confident in presentations.",
  ],
};

export const LAYER_4_QUESTIONS: Record<string, string[]> = {
  "Educational Background": [
    "I have access to quality academic resources (books, teachers, labs).",
    "I attend or have attended a school/college with strong academic performance.",
    "My academic environment encourages exploration and innovation.",
    "My curriculum included diverse subjects and career awareness programs.",
  ],
  "Socioeconomic Factors": [
    "I have access to stable internet, computer, and other learning tools.",
    "Financial limitations have restricted my career exploration so far.",
    "My family can support me in pursuing higher education or specialized training.",
    "I’ve had opportunities to attend coaching, mentorship, or skill programs.",
  ],
  "Career Exposure": [
    "I’ve interacted with professionals from various career paths.",
    "I have participated in internships, shadowing, or volunteering roles.",
    "I’ve been exposed to diverse career stories through media or workshops.",
    "My school/college offers good career counseling services.",
  ],
};

export const LAYER_5_QUESTIONS: Record<string, string[]> = {
  "Interests and Passions": [
    "I have clear hobbies or subjects that I love spending time on.",
    "I often find myself researching or learning about certain topics outside class.",
    "I get excited about working on personal or creative projects.",
    "I follow certain professionals or industries with great interest.",
  ],
  "Career Trends Awareness": [
    "I am aware of new and emerging fields in the job market.",
    "I regularly explore how careers are evolving with technology and globalization.",
    "I consider long-term career sustainability when thinking about professions.",
  ],
  "Personal Goals and Values": [
    "I have written down or thought deeply about my career goals.",
    "My career decisions are guided by my personal values (e.g., helping others, creativity, stability).",
    "I think about the impact I want to create through my work.",
    "I consider work-life balance and personal fulfillment when imagining my future job.",
  ],
};

export const LAYER_6_QUESTIONS: Record<string, string[] | { instructions: string; questions: string[] }> = {
  "Self_Synthesis": [
    "Based on my intelligence strengths, the types of activities I naturally enjoy are: (open-ended)",
    "Based on my personality, I thrive in environments that are: (open-ended)",
    "The industries and roles that excite me most are: (open-ended)",
    "I feel most motivated when my work allows me to: (open-ended)",
    "I now realize that I need a career that balances: (open-ended)",
    "My top 3 career interest areas are: (open-ended)",
    "A role I now want to research deeper or shadow is: (open-ended)",
  ],
  "Passion_Practicality": {
    instructions: "Now, let's assess the top 3 career areas you identified in the previous section. 'Career 1', 'Career 2', and 'Career 3' refer to the interests you listed. This exercise helps you balance passion with practical considerations.",
    questions: [
      "Career 1: How passionate are you about this career?",
      "Career 1: How well does it match your intelligence/personality?",
      "Career 1: How practical is it in terms of income/lifestyle?",
      "Career 1: How accessible is it to you (education/network)?",
      "Career 1: How sustainable is it in the long term?",
      "Career 2: How passionate are you about this career?",
      "Career 2: How well does it match your intelligence/personality?",
      "Career 2: How practical is it in terms of income/lifestyle?",
      "Career 2: How accessible is it to you (education/network)?",
      "Career 2: How sustainable is it in the long term?",
      "Career 3: How passionate are you about this career?",
      "Career 3: How well does it match your intelligence/personality?",
      "Career 3: How practical is it in terms of income/lifestyle?",
      "Career 3: How accessible is it to you (education/network)?",
      "Career 3: How sustainable is it in the long term?",
    ]
  },
  "Confidence_Check": [
    "How confident do you feel in your current career direction? (1-5)",
    "What’s holding you back from pursuing your top option(s)? (open-ended)",
    "What fears or doubts do you still have? (open-ended)",
    "What kind of support would help you feel more confident? (open-ended)",
  ],
  "Career_Clustering": {
    instructions: "Career Clustering helps identify which career groupings align best with your personality, skills, and interests. Based on your previous responses, rate how well each career cluster describes you or your ideal work environment. If none fit perfectly, you can specify your own cluster in 'Other'.",
    questions: [
      "Creative & Expressive (High linguistic/artistic, intuitive, low structure, values expression)",
      "Analytical & Investigative (Logical-mathematical, investigative, high in openness & autonomy)",
      "Social Impact & People-Centric (Interpersonal, high empathy, values connection, collaboration)",
      "Structured & Strategic (Conventional/enterprising, conscientious, prefers clarity, order)",
      "Tech & Engineering (Realistic + logical, enjoys tools, systems, innovation)",
      "Nature & Sustainability (Naturalistic, values environment, real-world application)",
      "Entrepreneurial & Leadership (High enterprising, self-determined, values risk-taking and autonomy)",
      "Other (Please specify your own career cluster)"
    ]
  },
  "Action_Plan": [
    "Who can help you on this journey? (Mentors, peers, family, online groups) (open-ended)",
  ],
};

export const CAREER_MAPPING: Record<string, string[]> = {
  Linguistic: ["Journalism", "Content Writing", "Law", "Public Relations", "Teaching"],
  "Logical-Mathematical": ["Data Science", "Engineering", "Finance", "Research", "Software Development"],
  Spatial: ["Graphic Design", "Architecture", "UX Design", "Animation", "Cartography"],
  "Bodily-Kinesthetic": ["Sports Coaching", "Physical Therapy", "Dance", "Carpentry", "Surgery"],
  Interpersonal: ["Human Resources", "Psychology", "Social Work", "Marketing", "Counseling"],
  Intrapersonal: ["Entrepreneur", "Researcher", "Philosopher", "Author", "Career Consultant"],
  Naturalistic: ["Environmental Science", "Forestry", "Agriculture", "Wildlife Conservation", "Geology"],
  Musical: ["Music Production", "Sound Engineering", "Music Therapy", "Performing Arts", "Composer"],
  Sternberg_Analytical: ["Data Analysis", "Policy Analysis", "Academic Research", "Management Consulting"],
  Sternberg_Creative: ["Advertising", "Film Production", "Game Design", "Creative Writing"],
  Sternberg_Practical: ["Project Management", "Logistics", "Entrepreneurship", "Sales"],
  MBTI_INFP: ["Counseling", "Writing", "Nonprofit Work", "Art Therapy"],
  RIASEC_Investigative: ["Scientist", "Researcher", "Data Analyst", "Engineer"],
  RIASEC_Artistic: ["Artist", "Writer", "Designer", "Musician"],
  RIASEC_Social: ["Teacher", "Social Worker", "Nurse", "Counselor"],
  Technology: ["Software Engineer", "Data Scientist", "Cybersecurity Analyst", "AI Researcher", "DevOps Engineer", "Cloud Architect"],
  Healthcare: ["Doctor", "Nurse", "Pharmacist", "Medical Researcher", "Physical Therapist", "Healthcare Administrator"],
  Business: ["Entrepreneur", "Marketing Manager", "Financial Analyst", "HR Specialist", "Management Consultant", "Supply Chain Analyst"],
  Creative: ["Graphic Designer", "Writer", "Musician", "Film Director", "Game Designer", "Interior Designer"],
  Education: ["Teacher", "Professor", "Educational Consultant", "Librarian", "Instructional Designer"],
  Engineering: ["Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Aerospace Engineer", "Environmental Engineer"],
  Science: ["Biologist", "Chemist", "Physicist", "Geologist", "Astronomer"],
  Values_Impact: ["Nonprofit Management", "Environmental Advocacy", "Public Health"],
  Industry_Technology: ["Software Engineer", "AI Specialist", "Cybersecurity Analyst"],
  Career_Clustering_Creative: ["Content Creator", "Graphic Designer", "Filmmaker"],
  Career_Clustering_Analytical: ["Data Scientist", "Research Scientist", "Financial Analyst"],
};
