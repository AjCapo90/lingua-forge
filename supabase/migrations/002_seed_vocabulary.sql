-- ============================================================
-- English Vocabulary Seed - B1/B2 Level
-- Common words with Italian translations and examples
-- ============================================================

INSERT INTO items (target_language, type, content, definition, translations, ipa_pronunciation, part_of_speech, cefr_level, frequency_rank, frequency_tier, examples, category) VALUES

-- High Frequency Verbs
('en', 'vocabulary', 'achieve', 'to successfully complete something or reach a goal', '{"it": "raggiungere, ottenere"}', '/əˈtʃiːv/', 'verb', 'B1', 1, 'high', ARRAY['She achieved her goal of learning English.', 'What do you want to achieve this year?'], 'verbs'),
('en', 'vocabulary', 'afford', 'to have enough money to buy something', '{"it": "permettersi"}', '/əˈfɔːrd/', 'verb', 'B1', 2, 'high', ARRAY['I can''t afford a new car right now.', 'Can you afford to take a vacation?'], 'verbs'),
('en', 'vocabulary', 'avoid', 'to stay away from something or someone', '{"it": "evitare"}', '/əˈvɔɪd/', 'verb', 'B1', 3, 'high', ARRAY['Try to avoid making the same mistake.', 'He avoids eating sugar.'], 'verbs'),
('en', 'vocabulary', 'blame', 'to say someone is responsible for something bad', '{"it": "incolpare"}', '/bleɪm/', 'verb', 'B1', 4, 'high', ARRAY['Don''t blame me for your mistakes.', 'Who is to blame for this problem?'], 'verbs'),
('en', 'vocabulary', 'bother', 'to annoy or disturb someone', '{"it": "disturbare, infastidire"}', '/ˈbɒðər/', 'verb', 'B1', 5, 'high', ARRAY['Sorry to bother you, but I need help.', 'Don''t bother calling, I''ll be out.'], 'verbs'),
('en', 'vocabulary', 'commit', 'to promise to do something; to do something wrong', '{"it": "impegnarsi, commettere"}', '/kəˈmɪt/', 'verb', 'B2', 6, 'high', ARRAY['He committed to studying every day.', 'She committed a serious error.'], 'verbs'),
('en', 'vocabulary', 'complain', 'to express dissatisfaction about something', '{"it": "lamentarsi"}', '/kəmˈpleɪn/', 'verb', 'B1', 7, 'high', ARRAY['Stop complaining and do something!', 'Customers complained about the service.'], 'verbs'),
('en', 'vocabulary', 'convince', 'to make someone believe or agree', '{"it": "convincere"}', '/kənˈvɪns/', 'verb', 'B1', 8, 'high', ARRAY['I convinced her to come with us.', 'How can I convince you?'], 'verbs'),
('en', 'vocabulary', 'deserve', 'to be worthy of something', '{"it": "meritare"}', '/dɪˈzɜːrv/', 'verb', 'B1', 9, 'high', ARRAY['You deserve a break after all that work.', 'He deserves to win.'], 'verbs'),
('en', 'vocabulary', 'encourage', 'to give support or confidence to someone', '{"it": "incoraggiare"}', '/ɪnˈkʌrɪdʒ/', 'verb', 'B1', 10, 'high', ARRAY['Teachers should encourage students.', 'I encourage you to try again.'], 'verbs'),

-- More Verbs
('en', 'vocabulary', 'hesitate', 'to pause before doing something because of uncertainty', '{"it": "esitare"}', '/ˈhezɪteɪt/', 'verb', 'B2', 11, 'medium', ARRAY['Don''t hesitate to ask for help.', 'She hesitated before answering.'], 'verbs'),
('en', 'vocabulary', 'improve', 'to make or become better', '{"it": "migliorare"}', '/ɪmˈpruːv/', 'verb', 'B1', 12, 'high', ARRAY['I want to improve my English.', 'The situation has improved.'], 'verbs'),
('en', 'vocabulary', 'influence', 'to have an effect on someone or something', '{"it": "influenzare"}', '/ˈɪnfluəns/', 'verb', 'B2', 13, 'medium', ARRAY['Music can influence your mood.', 'Who influenced your decision?'], 'verbs'),
('en', 'vocabulary', 'involve', 'to include as a necessary part', '{"it": "coinvolgere, comportare"}', '/ɪnˈvɒlv/', 'verb', 'B2', 14, 'high', ARRAY['The job involves a lot of travel.', 'Don''t involve me in your problems.'], 'verbs'),
('en', 'vocabulary', 'lack', 'to not have enough of something', '{"it": "mancare di"}', '/læk/', 'verb', 'B2', 15, 'medium', ARRAY['He lacks confidence.', 'The project lacks funding.'], 'verbs'),
('en', 'vocabulary', 'maintain', 'to keep something in good condition', '{"it": "mantenere"}', '/meɪnˈteɪn/', 'verb', 'B2', 16, 'medium', ARRAY['It''s important to maintain good habits.', 'They maintain a healthy lifestyle.'], 'verbs'),
('en', 'vocabulary', 'manage', 'to succeed in doing something difficult; to control', '{"it": "riuscire, gestire"}', '/ˈmænɪdʒ/', 'verb', 'B1', 17, 'high', ARRAY['I managed to finish on time.', 'She manages a team of ten people.'], 'verbs'),
('en', 'vocabulary', 'mention', 'to speak or write about briefly', '{"it": "menzionare"}', '/ˈmenʃn/', 'verb', 'B1', 18, 'high', ARRAY['Did I mention the meeting tomorrow?', 'He mentioned your name.'], 'verbs'),
('en', 'vocabulary', 'overcome', 'to succeed in dealing with a problem', '{"it": "superare, vincere"}', '/ˌəʊvərˈkʌm/', 'verb', 'B2', 19, 'medium', ARRAY['She overcame her fear of flying.', 'We can overcome this challenge.'], 'verbs'),
('en', 'vocabulary', 'persuade', 'to make someone agree to do something', '{"it": "persuadere"}', '/pərˈsweɪd/', 'verb', 'B2', 20, 'medium', ARRAY['I persuaded him to stay.', 'Can you persuade her to help?'], 'verbs'),

-- Adjectives
('en', 'vocabulary', 'anxious', 'feeling worried or nervous', '{"it": "ansioso, preoccupato"}', '/ˈæŋkʃəs/', 'adjective', 'B1', 21, 'high', ARRAY['I feel anxious about the exam.', 'She was anxious to hear the results.'], 'adjectives'),
('en', 'vocabulary', 'appropriate', 'suitable for a particular situation', '{"it": "appropriato, adatto"}', '/əˈprəʊpriət/', 'adjective', 'B2', 22, 'medium', ARRAY['Is this dress appropriate for the party?', 'That comment wasn''t appropriate.'], 'adjectives'),
('en', 'vocabulary', 'aware', 'knowing about something', '{"it": "consapevole"}', '/əˈweər/', 'adjective', 'B1', 23, 'high', ARRAY['Are you aware of the problem?', 'I wasn''t aware that you were here.'], 'adjectives'),
('en', 'vocabulary', 'brilliant', 'extremely intelligent or impressive', '{"it": "brillante, geniale"}', '/ˈbrɪliənt/', 'adjective', 'B1', 24, 'high', ARRAY['She has a brilliant mind.', 'That''s a brilliant idea!'], 'adjectives'),
('en', 'vocabulary', 'capable', 'having the ability to do something', '{"it": "capace"}', '/ˈkeɪpəbl/', 'adjective', 'B2', 25, 'medium', ARRAY['She is capable of great things.', 'Are you capable of handling this?'], 'adjectives'),
('en', 'vocabulary', 'confident', 'feeling sure about yourself or something', '{"it": "sicuro, fiducioso"}', '/ˈkɒnfɪdənt/', 'adjective', 'B1', 26, 'high', ARRAY['I''m confident we will succeed.', 'She seems very confident.'], 'adjectives'),
('en', 'vocabulary', 'curious', 'wanting to know or learn about something', '{"it": "curioso"}', '/ˈkjʊəriəs/', 'adjective', 'B1', 27, 'high', ARRAY['I''m curious about your trip.', 'Children are naturally curious.'], 'adjectives'),
('en', 'vocabulary', 'disappointed', 'sad because something was not as good as expected', '{"it": "deluso"}', '/ˌdɪsəˈpɔɪntɪd/', 'adjective', 'B1', 28, 'high', ARRAY['I was disappointed with the results.', 'Don''t be disappointed.'], 'adjectives'),
('en', 'vocabulary', 'efficient', 'working well without wasting time or resources', '{"it": "efficiente"}', '/ɪˈfɪʃnt/', 'adjective', 'B2', 29, 'medium', ARRAY['This is a very efficient system.', 'She is an efficient worker.'], 'adjectives'),
('en', 'vocabulary', 'essential', 'absolutely necessary', '{"it": "essenziale"}', '/ɪˈsenʃl/', 'adjective', 'B2', 30, 'medium', ARRAY['Water is essential for life.', 'Good communication is essential.'], 'adjectives'),

-- More Adjectives
('en', 'vocabulary', 'exhausted', 'extremely tired', '{"it": "esausto, sfinito"}', '/ɪɡˈzɔːstɪd/', 'adjective', 'B1', 31, 'high', ARRAY['I was exhausted after the marathon.', 'She looked completely exhausted.'], 'adjectives'),
('en', 'vocabulary', 'familiar', 'well known; having good knowledge of', '{"it": "familiare, conosciuto"}', '/fəˈmɪliər/', 'adjective', 'B1', 32, 'high', ARRAY['This place looks familiar.', 'Are you familiar with this software?'], 'adjectives'),
('en', 'vocabulary', 'flexible', 'able to change or be changed easily', '{"it": "flessibile"}', '/ˈfleksəbl/', 'adjective', 'B2', 33, 'medium', ARRAY['We need a flexible schedule.', 'She''s very flexible about working hours.'], 'adjectives'),
('en', 'vocabulary', 'grateful', 'feeling thankful', '{"it": "grato, riconoscente"}', '/ˈɡreɪtfl/', 'adjective', 'B1', 34, 'high', ARRAY['I''m grateful for your help.', 'We are grateful to have you here.'], 'adjectives'),
('en', 'vocabulary', 'obvious', 'easy to see or understand', '{"it": "ovvio, evidente"}', '/ˈɒbviəs/', 'adjective', 'B1', 35, 'high', ARRAY['The answer is obvious.', 'It''s obvious that she''s lying.'], 'adjectives'),
('en', 'vocabulary', 'patient', 'able to wait without getting annoyed', '{"it": "paziente"}', '/ˈpeɪʃnt/', 'adjective', 'B1', 36, 'high', ARRAY['Please be patient with me.', 'Teachers need to be patient.'], 'adjectives'),
('en', 'vocabulary', 'reasonable', 'fair and sensible', '{"it": "ragionevole"}', '/ˈriːznəbl/', 'adjective', 'B2', 37, 'medium', ARRAY['That''s a reasonable price.', 'Let''s be reasonable about this.'], 'adjectives'),
('en', 'vocabulary', 'reliable', 'that can be trusted', '{"it": "affidabile"}', '/rɪˈlaɪəbl/', 'adjective', 'B2', 38, 'medium', ARRAY['He''s a very reliable employee.', 'Is this information reliable?'], 'adjectives'),
('en', 'vocabulary', 'satisfied', 'pleased because you have what you want', '{"it": "soddisfatto"}', '/ˈsætɪsfaɪd/', 'adjective', 'B1', 39, 'high', ARRAY['I''m satisfied with my progress.', 'Are you satisfied with the service?'], 'adjectives'),
('en', 'vocabulary', 'suspicious', 'feeling that something is wrong', '{"it": "sospettoso"}', '/səˈspɪʃəs/', 'adjective', 'B2', 40, 'medium', ARRAY['I''m suspicious of his intentions.', 'The police found it suspicious.'], 'adjectives'),

-- Nouns
('en', 'vocabulary', 'advantage', 'something that helps you or is useful', '{"it": "vantaggio"}', '/ədˈvɑːntɪdʒ/', 'noun', 'B1', 41, 'high', ARRAY['Speaking English is a big advantage.', 'What are the advantages of this method?'], 'nouns'),
('en', 'vocabulary', 'approach', 'a way of dealing with something', '{"it": "approccio"}', '/əˈprəʊtʃ/', 'noun', 'B2', 42, 'medium', ARRAY['We need a new approach to this problem.', 'What''s your approach?'], 'nouns'),
('en', 'vocabulary', 'attitude', 'the way you think and feel about something', '{"it": "atteggiamento"}', '/ˈætɪtjuːd/', 'noun', 'B1', 43, 'high', ARRAY['She has a positive attitude.', 'Your attitude needs to change.'], 'nouns'),
('en', 'vocabulary', 'behavior', 'the way someone acts', '{"it": "comportamento"}', '/bɪˈheɪvjər/', 'noun', 'B1', 44, 'high', ARRAY['His behavior was unacceptable.', 'Good behavior is rewarded.'], 'nouns'),
('en', 'vocabulary', 'benefit', 'an advantage or something that helps you', '{"it": "beneficio, vantaggio"}', '/ˈbenɪfɪt/', 'noun', 'B2', 45, 'medium', ARRAY['What are the benefits of exercise?', 'This will benefit everyone.'], 'nouns'),
('en', 'vocabulary', 'challenge', 'something difficult that tests your ability', '{"it": "sfida"}', '/ˈtʃælɪndʒ/', 'noun', 'B1', 46, 'high', ARRAY['Learning a language is a challenge.', 'I enjoy a good challenge.'], 'nouns'),
('en', 'vocabulary', 'circumstance', 'a condition or fact that affects a situation', '{"it": "circostanza"}', '/ˈsɜːrkəmstæns/', 'noun', 'B2', 47, 'medium', ARRAY['Under the circumstances, we had no choice.', 'It depends on the circumstances.'], 'nouns'),
('en', 'vocabulary', 'consequence', 'a result of something that happened', '{"it": "conseguenza"}', '/ˈkɒnsɪkwəns/', 'noun', 'B2', 48, 'medium', ARRAY['Every action has consequences.', 'You must accept the consequences.'], 'nouns'),
('en', 'vocabulary', 'deadline', 'a time by which something must be done', '{"it": "scadenza"}', '/ˈdedlaɪn/', 'noun', 'B1', 49, 'high', ARRAY['The deadline is next Friday.', 'I always meet my deadlines.'], 'nouns'),
('en', 'vocabulary', 'evidence', 'facts or signs that show something is true', '{"it": "prova, evidenza"}', '/ˈevɪdəns/', 'noun', 'B2', 50, 'medium', ARRAY['There is no evidence of this.', 'The evidence suggests otherwise.'], 'nouns'),

-- Adverbs and Expressions
('en', 'vocabulary', 'actually', 'in fact, really (often to correct or clarify)', '{"it": "in realtà, veramente"}', '/ˈæktʃuəli/', 'adverb', 'B1', 51, 'high', ARRAY['Actually, I disagree with you.', 'I actually enjoyed the movie.'], 'adverbs'),
('en', 'vocabulary', 'apparently', 'it seems that; according to what people say', '{"it": "apparentemente, a quanto pare"}', '/əˈpærəntli/', 'adverb', 'B2', 52, 'medium', ARRAY['Apparently, he quit his job.', 'She apparently forgot about the meeting.'], 'adverbs'),
('en', 'vocabulary', 'approximately', 'about, roughly', '{"it": "approssimativamente, circa"}', '/əˈprɒksɪmətli/', 'adverb', 'B2', 53, 'medium', ARRAY['It takes approximately two hours.', 'There were approximately 50 people.'], 'adverbs'),
('en', 'vocabulary', 'basically', 'in the most important ways', '{"it": "fondamentalmente, in pratica"}', '/ˈbeɪsɪkli/', 'adverb', 'B1', 54, 'high', ARRAY['Basically, you need to work harder.', 'It''s basically the same thing.'], 'adverbs'),
('en', 'vocabulary', 'definitely', 'without any doubt', '{"it": "sicuramente, decisamente"}', '/ˈdefɪnətli/', 'adverb', 'B1', 55, 'high', ARRAY['I will definitely come tomorrow.', 'This is definitely the best option.'], 'adverbs'),
('en', 'vocabulary', 'eventually', 'in the end, after a period of time', '{"it": "alla fine, prima o poi"}', '/ɪˈventʃuəli/', 'adverb', 'B1', 56, 'high', ARRAY['Eventually, he found a job.', 'We''ll get there eventually.'], 'adverbs'),
('en', 'vocabulary', 'fortunately', 'luckily', '{"it": "fortunatamente"}', '/ˈfɔːrtʃənətli/', 'adverb', 'B1', 57, 'high', ARRAY['Fortunately, no one was hurt.', 'Fortunately, I had a backup.'], 'adverbs'),
('en', 'vocabulary', 'obviously', 'in a way that is easy to see or understand', '{"it": "ovviamente"}', '/ˈɒbviəsli/', 'adverb', 'B1', 58, 'high', ARRAY['Obviously, I made a mistake.', 'He''s obviously very talented.'], 'adverbs'),
('en', 'vocabulary', 'properly', 'in a correct or suitable way', '{"it": "correttamente, bene"}', '/ˈprɒpəli/', 'adverb', 'B1', 59, 'high', ARRAY['Make sure to do it properly.', 'The machine isn''t working properly.'], 'adverbs'),
('en', 'vocabulary', 'slightly', 'a little', '{"it": "leggermente, un po''"}', '/ˈslaɪtli/', 'adverb', 'B1', 60, 'high', ARRAY['I''m slightly worried about this.', 'The price has increased slightly.'], 'adverbs');

-- Phrasal Verbs (Italian learners struggle with these!)
INSERT INTO items (target_language, type, content, definition, translations, part_of_speech, cefr_level, frequency_rank, frequency_tier, examples, category, l1_interference_patterns) VALUES
('en', 'phrasal_verb', 'carry on', 'to continue doing something', '{"it": "continuare, andare avanti"}', 'phrasal verb', 'B1', 61, 'high', ARRAY['Carry on with your work.', 'We must carry on despite the difficulties.'], 'phrasal_verbs', '{"it": "Italians often say ''continue'' instead of using the phrasal verb"}'),
('en', 'phrasal_verb', 'come across', 'to find or meet by chance', '{"it": "imbattersi in, trovare per caso"}', 'phrasal verb', 'B2', 62, 'medium', ARRAY['I came across an old photo yesterday.', 'She comes across as very friendly.'], 'phrasal_verbs', '{"it": "Often translated literally, which doesn''t work"}'),
('en', 'phrasal_verb', 'figure out', 'to understand or solve something', '{"it": "capire, risolvere"}', 'phrasal verb', 'B1', 63, 'high', ARRAY['I can''t figure out this problem.', 'We need to figure out what to do.'], 'phrasal_verbs', '{"it": "Italians typically use ''understand'' or ''resolve'' directly"}'),
('en', 'phrasal_verb', 'get along', 'to have a good relationship with someone', '{"it": "andare d''accordo"}', 'phrasal verb', 'B1', 64, 'high', ARRAY['Do you get along with your colleagues?', 'They don''t get along very well.'], 'phrasal_verbs', '{"it": "Direct translation ''andare lungo'' doesn''t work"}'),
('en', 'phrasal_verb', 'give up', 'to stop trying; to quit', '{"it": "arrendersi, rinunciare"}', 'phrasal verb', 'B1', 65, 'high', ARRAY['Don''t give up! Keep trying.', 'He gave up smoking last year.'], 'phrasal_verbs', '{"it": "Often correctly used by Italians"}'),
('en', 'phrasal_verb', 'go through', 'to experience something difficult', '{"it": "attraversare, passare (un momento)"}', 'phrasal verb', 'B2', 66, 'medium', ARRAY['She''s going through a difficult time.', 'Let''s go through the details.'], 'phrasal_verbs', '{"it": "Literal translation doesn''t convey the meaning"}'),
('en', 'phrasal_verb', 'look forward to', 'to feel excited about something that will happen', '{"it": "non vedere l''ora di"}', 'phrasal verb', 'B1', 67, 'high', ARRAY['I look forward to seeing you.', 'We''re looking forward to the vacation.'], 'phrasal_verbs', '{"it": "Very common in emails, Italians often forget ''to''"}'),
('en', 'phrasal_verb', 'make up', 'to invent; to become friends again', '{"it": "inventare; fare pace"}', 'phrasal verb', 'B1', 68, 'high', ARRAY['Don''t make up excuses.', 'They argued but then made up.'], 'phrasal_verbs', '{"it": "Multiple meanings confuse Italian learners"}'),
('en', 'phrasal_verb', 'put off', 'to delay or postpone', '{"it": "rimandare, posticipare"}', 'phrasal verb', 'B2', 69, 'medium', ARRAY['Let''s put off the meeting until next week.', 'Stop putting off your homework!'], 'phrasal_verbs', '{"it": "Italians prefer ''postpone'' or ''rimandare'' directly"}'),
('en', 'phrasal_verb', 'turn out', 'to happen in a particular way; to prove to be', '{"it": "risultare, rivelarsi"}', 'phrasal verb', 'B2', 70, 'medium', ARRAY['Everything turned out fine in the end.', 'It turned out to be a mistake.'], 'phrasal_verbs', '{"it": "Abstract meaning is difficult for Italians"}');
