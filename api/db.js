import { sql } from '@vercel/postgres';

// Initialize tables if they don't exist
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      quote_id INTEGER,
      played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      source VARCHAR(255)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_scores_played_at ON scores(played_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id)`;
}

// Seed quotes if empty
export async function seedQuotes() {
  const { rows } = await sql`SELECT COUNT(*) as count FROM quotes`;
  if (parseInt(rows[0].count) > 0) return;

  const quotes = [
    { text: "The only thing we have to fear is fear itself, nameless, unreasoning, unjustified terror which paralyzes needed efforts to convert retreat into advance. In every dark hour of our national life, a leadership of frankness has met.", source: "Franklin D. Roosevelt, First Inaugural Address" },
    { text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season.", source: "Charles Dickens, A Tale of Two Cities" },
    { text: "To be, or not to be, that is the question. Whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles and end them.", source: "William Shakespeare, Hamlet" },
    { text: "In the beginning God created the heaven and the earth. And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.", source: "Genesis 1:1-2, King James Bible" },
    { text: "Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war.", source: "Abraham Lincoln, Gettysburg Address" },
    { text: "I have a dream that one day this nation will rise up and live out the true meaning of its creed: We hold these truths to be self-evident, that all men are created equal. I have a dream today.", source: "Martin Luther King Jr., I Have a Dream" },
    { text: "Ask not what your country can do for you, ask what you can do for your country. My fellow citizens of the world, ask not what America will do for you, but what together we can do for freedom.", source: "John F. Kennedy, Inaugural Address" },
    { text: "We choose to go to the moon in this decade and do the other things, not because they are easy, but because they are hard, because that goal will serve to organize and measure the best of our energies.", source: "John F. Kennedy, Rice University Speech" },
    { text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering.", source: "Jane Austen, Pride and Prejudice" },
    { text: "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part.", source: "Herman Melville, Moby-Dick" },
    { text: "All happy families are alike; each unhappy family is unhappy in its own way. Everything was in confusion in the Oblonskys' house. The wife had discovered that the husband was carrying on an intrigue with their former French governess.", source: "Leo Tolstoy, Anna Karenina" },
    { text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle. As with all matters of the heart, you'll know when you find it. Stay hungry, stay foolish.", source: "Steve Jobs, Stanford Commencement" },
    { text: "Here's to the crazy ones, the misfits, the rebels, the troublemakers, the round pegs in the square holes, the ones who see things differently. They're not fond of rules. You can quote them, disagree with them, glorify or vilify them.", source: "Apple, Think Different Campaign" },
    { text: "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference. I shall be telling this with a sigh somewhere ages and ages hence: Two roads diverged in the wood.", source: "Robert Frost, The Road Not Taken" },
    { text: "Do not go gentle into that good night. Old age should burn and rave at close of day. Rage, rage against the dying of the light. Though wise men at their end know dark is right, because their words had forked.", source: "Dylan Thomas, Do Not Go Gentle" },
    { text: "I wandered lonely as a cloud that floats on high over vales and hills, when all at once I saw a crowd, a host of golden daffodils beside the lake, beneath the trees, fluttering and dancing in the breeze that day.", source: "William Wordsworth, Daffodils" },
    { text: "The first rule of Fight Club is: you do not talk about Fight Club. The second rule of Fight Club is: you do not talk about Fight Club. Third rule of Fight Club: if someone yells stop, goes limp, or taps out.", source: "Chuck Palahniuk, Fight Club" },
    { text: "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit on.", source: "J.R.R. Tolkien, The Hobbit" },
    { text: "It is our choices, Harry, that show what we truly are, far more than our abilities. The truth is a beautiful and terrible thing, and should therefore be treated with great caution. It does not do to dwell on dreams and forget.", source: "J.K. Rowling, Harry Potter" },
    { text: "The man in black fled across the desert, and the gunslinger followed. The desert was the apotheosis of all deserts, huge, standing to the sky for what looked like eternity in all directions. It was white and blinding and waterless.", source: "Stephen King, The Dark Tower" },
    { text: "Space: the final frontier. These are the voyages of the starship Enterprise. Its five-year mission: to explore strange new worlds, to seek out new life and new civilizations, to boldly go where no man has gone before, and beyond.", source: "Star Trek, Opening Narration" },
    { text: "A long time ago in a galaxy far, far away, it is a period of civil war. Rebel spaceships, striking from a hidden base, have won their first victory against the evil Galactic Empire during a battle for freedom.", source: "Star Wars, Opening Crawl" },
    { text: "The cosmos is all that is or ever was or ever will be. Our feeblest contemplations of the cosmos stir us. There is a tingling in the spine, a catch in the voice, a faint sensation, as if a distant memory.", source: "Carl Sagan, Cosmos" },
    { text: "We are made of star stuff. We are a way for the universe to know itself. Some part of our being knows this is where we came from. We long to return, and we can, because the cosmos is within us all.", source: "Carl Sagan, Cosmos" },
    { text: "Somewhere, something incredible is waiting to be known. The universe is not required to be in perfect harmony with human ambition. For small creatures such as we, the vastness is bearable only through love and the pursuit of knowledge, always.", source: "Carl Sagan" },
    { text: "The nitrogen in our DNA, the calcium in our teeth, the iron in our blood, the carbon in our apple pies were made in the interiors of collapsing stars. We are made of starstuff. We are the universe experiencing itself.", source: "Carl Sagan, Cosmos" },
    { text: "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world. Logic will get you from A to B. Imagination will take you everywhere. The true sign of intelligence is not knowledge but imagination. Try to comprehend more.", source: "Albert Einstein" },
    { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe. Life is like riding a bicycle. To keep your balance, you must keep moving forward through all obstacles. Learn from yesterday, live for today.", source: "Albert Einstein" },
    { text: "That's one small step for man, one giant leap for mankind. Houston, Tranquility Base here. The Eagle has landed. I believe that this nation should commit itself to achieving the goal of landing a man on the moon and returning him.", source: "Neil Armstrong & John F. Kennedy" },
    { text: "Mr. Gorbachev, tear down this wall! Freedom is never more than one generation away from extinction. We didn't pass it to our children in the bloodstream. It must be fought for, protected, and handed on for them to do the same.", source: "Ronald Reagan" },
    { text: "Float like a butterfly, sting like a bee. The hands can't hit what the eyes can't see. I am the greatest. I said that even before I knew I was. Don't count the days; make the days count every time.", source: "Muhammad Ali" },
    { text: "I've missed more than nine thousand shots in my career. I've lost almost three hundred games. Twenty-six times I've been trusted to take the game winning shot and missed. I've failed over and over and over again. That is why I succeed.", source: "Michael Jordan" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts. We shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields and in the streets. Never surrender.", source: "Winston Churchill" },
    { text: "Now this is not the end. It is not even the beginning of the end. But it is, perhaps, the end of the beginning. History will be kind to me for I intend to write it myself, with truth.", source: "Winston Churchill" },
    { text: "The future belongs to those who believe in the beauty of their dreams. No one can make you feel inferior without your consent. You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.", source: "Eleanor Roosevelt" },
    { text: "Be the change that you wish to see in the world. Live as if you were to die tomorrow. Learn as if you were to live forever. The weak can never forgive. Forgiveness is the attribute of the strong in spirit.", source: "Mahatma Gandhi" },
    { text: "Education is the most powerful weapon which you can use to change the world. It always seems impossible until it's done. I learned that courage was not the absence of fear, but the triumph over it. The brave man is fearless.", source: "Nelson Mandela" },
    { text: "I think, therefore I am. The reading of all good books is like a conversation with the finest minds of past centuries. Divide each difficulty into as many parts as is feasible and necessary to resolve it and understand it deeply.", source: "Rene Descartes" },
    { text: "The unexamined life is not worth living. I know that I know nothing. True wisdom comes to each of us when we realize how little we understand about life, ourselves, and the world around us. Wonder is the beginning of wisdom.", source: "Socrates" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit. It is the mark of an educated mind to be able to entertain a thought without accepting it. Knowing yourself is the beginning of all wisdom.", source: "Aristotle" },
    { text: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does. It is up to you to give life a meaning. Every existing thing is born without reason and dies by chance.", source: "Jean-Paul Sartre" },
    { text: "He who has a why to live can bear almost any how. That which does not kill us makes us stronger. Without music, life would be a mistake. There are no facts, only interpretations of what we choose to perceive daily.", source: "Friedrich Nietzsche" },
    { text: "The only true wisdom is in knowing you know nothing. There is only one good, knowledge, and one evil, ignorance. Strong minds discuss ideas, average minds discuss events, weak minds discuss people. Be kind, for everyone you meet is fighting hard.", source: "Socrates" },
    { text: "Yesterday is history, tomorrow is a mystery, but today is a gift. That is why it is called the present. Your mind is like water. When it is agitated, it becomes difficult to see. But if you allow it to settle.", source: "Kung Fu Panda & Ancient Wisdom" },
    { text: "In three words I can sum up everything I've learned about life: it goes on. The best way out is always through. In the middle of difficulty lies opportunity. Take the first step in faith even without the whole staircase.", source: "Robert Frost & Martin Luther King Jr." },
    { text: "Not all those who wander are lost. All we have to decide is what to do with the time that is given us. Even the smallest person can change the course of the future. There is some good in this world.", source: "J.R.R. Tolkien, The Lord of the Rings" },
    { text: "The truth is rarely pure and never simple. Modern life would be very tedious if it were either, and modern literature a complete impossibility. To live is the rarest thing in the world. Most people exist, that is all they do.", source: "Oscar Wilde" },
    { text: "It is not the critic who counts; not the man who points out how the strong man stumbles. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.", source: "Theodore Roosevelt, Citizenship in a Republic" },
    { text: "So we beat on, boats against the current, borne back ceaselessly into the past. In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since: reserve all judgments.", source: "F. Scott Fitzgerald, The Great Gatsby" },
    { text: "It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions.", source: "George Orwell, 1984" }
  ];

  for (const quote of quotes) {
    await sql`INSERT INTO quotes (text, source) VALUES (${quote.text}, ${quote.source})`;
  }
}

export { sql };
