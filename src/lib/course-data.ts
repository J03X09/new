export type Block =
	| { type: "p"; text: string }
	| { type: "list"; items: string[] }
	| { type: "quote"; text: string; author: string }
	| { type: "technique"; name: string; source: string; text: string }
	| { type: "script"; title: string; lines: string[] };

export interface Lesson {
	slug: string;
	title: string;
	summary: string;
	minutes: number;
	blocks: Block[];
	action: string;
}

export interface CourseModule {
	slug: string;
	title: string;
	description: string;
	lessons: Lesson[];
}

export const course: CourseModule[] = [
	{
		slug: "mindset",
		title: "1. The Sales Mindset Foundation",
		description: "Why income follows identity, and how to build the unshakeable belief high-ticket selling requires.",
		lessons: [
			{
				slug: "income-follows-identity",
				title: "Why Mindset Determines Income",
				summary: "The belief system that separates top 1% earners from the rest.",
				minutes: 8,
				blocks: [
					{
						type: "p",
						text: "High-ticket selling is not primarily a skills game — it is an identity game played out through skills. Two people can learn the exact same script, and one will out-earn the other 10-to-1, because the buyer can feel the certainty (or lack of it) behind the words. Your prospect is unconsciously asking one question the entire call: 'Does this person actually believe what they're telling me?' Everything else is downstream of that.",
					},
					{
						type: "quote",
						text: "You can have everything in life you want if you will just help enough other people get what they want.",
						author: "Zig Ziglar",
					},
					{
						type: "p",
						text: "Ziglar's point is not a platitude — it is a reframe of what selling actually is. The moment you see yourself as a problem-solver whose job is to move people toward a decision that helps them, rather than as someone extracting money from a stranger, your tonality, your patience, and your willingness to ask hard questions all change. Buyers can tell the difference between someone selling *at* them and someone selling *for* them.",
					},
					{
						type: "list",
						items: [
							"Selling is a transfer of certainty, not information — the most certain person in the room usually wins the deal.",
							"Every top closer has reframed 'no' from rejection into information about fit, timing, or an unresolved objection.",
							"Money is a byproduct of the value you move, not something you chase directly — chase mastery of the process instead.",
							"You are the thermostat, not the thermometer: you set the emotional temperature of the call, you don't just reflect the prospect's mood.",
						],
					},
				],
				action: "Write down, in one sentence, whose life gets better because you sell well. Read it before your next 3 calls.",
			},
			{
				slug: "rejection-and-abundance",
				title: "Rejection Is Data, Not a Verdict",
				summary: "The abundance mindset and the 'Go for No' philosophy that top closers use to stay unattached to any single deal.",
				minutes: 9,
				blocks: [
					{
						type: "p",
						text: "New sellers treat every 'no' as a personal loss. Elite closers treat it as a data point in a known ratio. Grant Cardone built his entire framework around the Law of Averages: if you know that, on average, 1 in 10 conversations becomes a sale, then every single 'no' is worth 10% of a 'yes' — it is literally moving you closer to your next close, not further away.",
					},
					{
						type: "technique",
						name: "Go for No",
						source: "Richard Fenton & Andrea Waltz",
						text: "Instead of setting a goal of X sales, set a goal of collecting a specific number of NO's per day or week. This inverts the emotional charge of rejection — you start actively pursuing it, which paradoxically removes the fear that was making you sound needy on calls, and needy is the single fastest way to lose a high-ticket buyer's respect.",
					},
					{
						type: "p",
						text: "This connects directly to the 'abundance mindset' you'll hear referenced constantly in high-ticket circles. It does not mean pretending you don't need the money. It means refusing to let any single prospect sense that you need *their* money specifically — because the instant a buyer senses desperation, their trust collapses and the price becomes the only thing they can evaluate you on.",
					},
					{
						type: "list",
						items: [
							"Desperation is detectable within seconds through pace, pitch, and word choice — prospects feel it before they can name it.",
							"The seller willing to walk away from a bad-fit deal is the one who closes the most good-fit deals — this is the 'take-away' effect covered in Module 5.",
							"Track your ratios (conversations : appointments : proposals : closes). Ratios turn an emotional rollercoaster into a predictable machine.",
						],
					},
				],
				action: "Calculate your current close ratio from your last 20 conversations (or estimate it if you're new). That number is now your permission slip to detach from any single 'no'.",
			},
		],
	},
	{
		slug: "high-ticket-fundamentals",
		title: "2. Understanding High-Ticket Sales",
		description: "What makes selling a $3,000–$50,000+ offer fundamentally different from selling a $50 product.",
		lessons: [
			{
				slug: "what-makes-it-different",
				title: "What Makes High-Ticket Different",
				summary: "Longer cycles, more stakeholders, and why you're selling trust before you're selling a product.",
				minutes: 7,
				blocks: [
					{
						type: "p",
						text: "Low-ticket sales are won on impulse and convenience. High-ticket sales are won on trust, perceived transformation, and risk reduction. The buyer isn't just asking 'can I afford this' — they're asking 'will this actually work for me, and can I trust the person and company standing behind it.' That shifts your job from persuasion to diagnosis: your primary output on a call is not a pitch, it's clarity about whether — and how — you can genuinely help.",
					},
					{
						type: "list",
						items: [
							"Decision cycles are longer — expect multiple touchpoints, not a single call, especially above $10k.",
							"More people are often involved in the decision (spouse, business partner, board) — surfacing this early prevents dead-end closes.",
							"Emotional risk is higher for the buyer — they're not just spending money, they're staking their reputation, time, or business outcome on the decision.",
							"You are positioned as an advisor, not a vendor — advisors ask diagnostic questions; vendors recite features.",
						],
					},
					{
						type: "quote",
						text: "People don't buy what you do, they buy why you do it — and in high-ticket sales, they buy whether they trust you enough to be led by you.",
						author: "Paraphrased sales principle, popularized by Simon Sinek",
					},
				],
				action: "List the last 3 high-ticket purchases you made yourself (course, coaching, car, home service). What made you trust the seller enough to say yes?",
			},
			{
				slug: "value-equation-positioning",
				title: "The Value Equation & Authority Positioning",
				summary: "Alex Hormozi's Value Equation, and why niching down makes you more sellable, not less.",
				minutes: 9,
				blocks: [
					{
						type: "technique",
						name: "The Value Equation",
						source: "Alex Hormozi",
						text: "Perceived Value = (Dream Outcome × Perceived Likelihood of Achievement) ÷ (Time Delay × Effort & Sacrifice). You increase the price a market will bear not by adding features, but by increasing the top of the equation (making the outcome bigger and more certain) and shrinking the bottom (making it faster and easier). Every objection you'll hear in Module 6 maps to one of these four variables — 'I'm not sure this will work for me' is a likelihood problem, 'I don't have time' is a delay/effort problem.",
					},
					{
						type: "p",
						text: "The second lever is positioning. Generalists compete on price because they're interchangeable. Specialists who serve one clearly defined type of client, with one clearly defined outcome, get referred, get taken seriously, and get to charge premium prices — because the prospect believes 'this person has done this exact thing for people exactly like me.'",
					},
					{
						type: "list",
						items: [
							"Define your Ideal Client Profile (ICP): who, specifically, gets the fastest and biggest result from what you sell.",
							"Speak in terms of outcomes and transformation, not hours, modules, or features.",
							"Use specific proof — named case studies and numbers beat vague claims like 'lots of happy clients' every time.",
						],
					},
				],
				action: "Write one sentence: 'I help [specific person] achieve [specific outcome] without [the thing they fear/hate].' Use it to open your next discovery call.",
			},
		],
	},
	{
		slug: "prospecting",
		title: "3. Prospecting & Qualifying",
		description: "Filling the pipeline with the right people, and disqualifying fast so you spend time only where it counts.",
		lessons: [
			{
				slug: "filling-the-pipeline",
				title: "Filling the Pipeline",
				summary: "The three lead sources every high-ticket closer should always have running.",
				minutes: 7,
				blocks: [
					{
						type: "p",
						text: "Relying on a single lead source is the number one reason high-ticket sellers have feast-or-famine months. Top performers always run three channels simultaneously, even when one is doing most of the work, because channels dry up without warning.",
					},
					{
						type: "list",
						items: [
							"Referral — the highest-trust, highest-close-rate channel. Ask every closed client (and even respectful non-buyers) for one introduction.",
							"Outbound — direct outreach to a defined ICP list. Lower response rate but fully within your control; volume compensates.",
							"Inbound/content — attracting people via visibility (content, ads, community presence) so they arrive pre-warmed and self-select in.",
						],
					},
					{
						type: "quote",
						text: "The fortune is in the follow-up, but the pipeline is in the referral.",
						author: "Common sales-floor axiom",
					},
					{
						type: "p",
						text: "Set a non-negotiable weekly floor for new-conversation activity (e.g. 20 new outreach touches + 3 referral asks), independent of how busy you are closing existing deals. Activity today is income in 30–60 days — the moment you stop prospecting because you're 'busy closing,' you create a income cliff a month out.",
					},
				],
				action: "Set your weekly prospecting floor right now — a specific number of new outreach touches and referral asks — and put it on a recurring calendar block.",
			},
			{
				slug: "qualifying-fast",
				title: "Qualifying Fast: BANT and the Pre-Call Frame",
				summary: "Disqualify in minutes, not hours, and set the frame before the call even starts.",
				minutes: 8,
				blocks: [
					{
						type: "technique",
						name: "BANT",
						source: "Classic B2B qualification framework (IBM origin)",
						text: "Budget, Authority, Need, Timeline. Before investing a full discovery call, get a rough read on whether the person can pay, can decide, actually has the problem you solve, and has a reason to act soon. In high-ticket consumer sales this is often softened to: can they realistically invest, are they the decision-maker (or who else is), is the pain real and current, and is there a deadline or trigger event.",
					},
					{
						type: "p",
						text: "Qualifying isn't interrogation — it's respect for both people's time. A well-qualified 'no' delivered in 5 minutes is a win; a poorly-qualified 60-minute call that goes nowhere is a loss disguised as effort.",
					},
					{
						type: "technique",
						name: "The Pre-Call Frame",
						source: "Common in Sandler-influenced high-ticket sales",
						text: "Before the discovery call even begins — in the booking confirmation or the first 60 seconds — set expectations: 'This call is for us to figure out honestly whether this is a fit. If it's not, I'll tell you and point you somewhere better. If it is, I'll walk you through what working together looks like. Fair enough?' This single frame removes the adversarial 'salesperson vs. buyer' dynamic before it can form.",
					},
					{
						type: "script",
						title: "Setting the frame at the top of a call",
						lines: [
							"\"Thanks for hopping on. Before we dive in — here's how I'd like to run this: I'm going to ask you some questions to understand where you're at and what you're trying to achieve. If I think I can genuinely help, I'll show you exactly how. If I don't think it's a fit, I'll tell you straight and point you elsewhere. Sound good?\"",
						],
					},
				],
				action: "Write your own pre-call frame script in your natural voice and use it verbatim on your next 5 calls.",
			},
		],
	},
	{
		slug: "discovery",
		title: "4. Discovery & Needs Analysis",
		description: "The questions that uncover real pain, and the listening skills that make prospects sell themselves.",
		lessons: [
			{
				slug: "spin-selling",
				title: "SPIN Selling: Question Sequencing That Works",
				summary: "The four-stage question framework validated across thousands of recorded sales calls.",
				minutes: 10,
				blocks: [
					{
						type: "technique",
						name: "SPIN Selling",
						source: "Neil Rackham",
						text: "Situation, Problem, Implication, Need-payoff. Rackham's research team analyzed over 35,000 sales calls and found that top performers ask questions in this order rather than pitching early. Situation questions gather context ('Walk me through how you currently handle X'). Problem questions surface dissatisfaction ('What's frustrating about that?'). Implication questions expand the cost of inaction ('What does that end up costing you — in time, money, or stress — if it stays this way?'). Need-payoff questions get the prospect to state the value of solving it out loud ('If you had that solved, what would that mean for you?').",
					},
					{
						type: "p",
						text: "The critical insight: Implication and Need-payoff questions do more selling than any pitch ever could, because the prospect — not you — is the one voicing the cost of the problem and the value of the solution. People trust conclusions they voice themselves far more than conclusions you hand them.",
					},
					{
						type: "list",
						items: [
							"Situation: 'How are you currently handling [area]?'",
							"Problem: 'What's not working about that?'",
							"Implication: 'If nothing changes, where does that leave you in 6 months?'",
							"Need-payoff: 'What would it be worth to you to have that fixed?'",
						],
					},
				],
				action: "Before your next call, write one Implication question and one Need-payoff question specific to your offer. Use both, in that order.",
			},
			{
				slug: "sandler-tactical-empathy",
				title: "The Pain Funnel & Tactical Empathy",
				summary: "Sandler's technique for digging past surface answers, plus Chris Voss's method for making prospects feel truly heard.",
				minutes: 10,
				blocks: [
					{
						type: "technique",
						name: "The Pain Funnel",
						source: "Sandler Selling System",
						text: "When a prospect gives a surface-level answer ('we need to grow revenue'), don't accept it — dig with a chain of open, non-defensive follow-ups: 'Tell me more about that.' 'Can you be more specific?' 'How long has that been a problem?' 'What have you tried?' 'What happened when you tried it?' 'How does that make you feel?' Each layer moves the prospect from a business-level answer toward the emotional, personal reason they actually want change — and that emotional layer is what drives decisions.",
					},
					{
						type: "technique",
						name: "Tactical Empathy: Mirroring & Labeling",
						source: "Chris Voss, Never Split the Difference",
						text: "Mirroring is repeating the last 1–3 words a person said, as a question — it costs you nothing and reliably makes people elaborate further ('...it's been costing us clients.' → 'Costing you clients?'). Labeling is naming the emotion you observe without judgment — 'It sounds like this has been really frustrating' — which makes people feel deeply understood and lowers their guard, often surfacing the real objection early instead of at the close.",
					},
					{
						type: "script",
						title: "Mirror + Label combo",
						lines: [
							"Prospect: \"Honestly we've tried two other consultants and nothing stuck.\"",
							"You: \"Nothing stuck?\" (mirror)",
							"Prospect: \"Yeah, we'd get a plan, get excited, and then it would just fizzle.\"",
							"You: \"It sounds like you're a little burned by that, and probably a bit skeptical of anyone new walking in with a plan.\" (label)",
						],
					},
				],
				action: "In your next 3 conversations, use at least one mirror and one label before you say anything persuasive. Notice how much more the prospect volunteers.",
			},
		],
	},
	{
		slug: "trust-and-presenting",
		title: "5. Trust, Authority & Presenting the Offer",
		description: "Earning the right to be believed, then presenting so the offer sells itself.",
		lessons: [
			{
				slug: "building-trust-take-away",
				title: "Building Trust & the Take-Away",
				summary: "How unbudgeable calm and strategic detachment build more authority than any pitch.",
				minutes: 8,
				blocks: [
					{
						type: "p",
						text: "Trust in a sales conversation is built less through what you say and more through what you don't need. A prospect can feel, within the first two minutes, whether you're chasing the sale or diagnosing a fit. The moment you're willing to say 'this might not be right for you' out loud, you become the most credible person on the call — because you've just proven you're not driven by commission-desperation.",
					},
					{
						type: "technique",
						name: "The Take-Away",
						source: "Sandler Selling System",
						text: "When a prospect starts pushing hard for a discount, a rushed timeline, or a customized exception, calmly offer to remove the offer rather than defend it: 'It sounds like this might not be the right fit right now — and that's genuinely fine, I'd rather we both know that than force it.' Counter to intuition, this often causes the prospect to re-sell themselves back into the deal, because the fear of losing something outweighs the desire to negotiate it down.",
					},
					{
						type: "list",
						items: [
							"Certainty is contagious — your calm, unhurried tone signals that the outcome doesn't hinge on this one call.",
							"Never chase a prospect who has gone quiet; a short, low-pressure check-in beats three anxious follow-ups.",
							"Credibility markers (case studies, specific results, third-party proof) should appear early, woven into questions — not saved for a slide at the end.",
						],
					},
				],
				action: "Identify one place in your current pitch where you over-explain or over-justify. Cut it in half next call — let silence and calm do the work instead.",
			},
			{
				slug: "value-based-presenting",
				title: "Presenting the Offer: Teach, Tailor, Take Control",
				summary: "The Challenger Sale approach — and why storytelling beats feature lists for high-ticket offers.",
				minutes: 9,
				blocks: [
					{
						type: "technique",
						name: "The Challenger Sale",
						source: "Matthew Dixon & Brent Adamson",
						text: "Research across thousands of B2B reps found the highest performers weren't the most relationship-friendly reps — they were 'Challengers' who taught prospects something new and non-obvious about their own problem, tailored that insight to the specific prospect's situation, and took control of the conversation (including pushing back respectfully on flawed assumptions) rather than passively accommodating every request.",
					},
					{
						type: "p",
						text: "In practice: don't just answer the question the prospect asked — teach them the thing they didn't know to ask about. If you sell fitness coaching, don't just describe the program; teach them why their last three attempts failed (usually a systems problem, not a willpower problem) and tailor that insight to their specific history before presenting your program as the fix for that specific root cause.",
					},
					{
						type: "list",
						items: [
							"Present the offer as the resolution to the specific implications the prospect already voiced in discovery — never a generic pitch.",
							"Use a before → after → bridge story structure: where they are, where they want to be, and your offer as the bridge.",
							"Frame price in terms of ROI or cost-of-inaction ('what is it costing you every month you don't fix this?') rather than presenting price in isolation.",
						],
					},
				],
				action: "Rewrite your standard pitch as a 3-part story: current pain (from discovery), desired future, and your offer as the bridge. Practice it out loud once.",
			},
		],
	},
	{
		slug: "objections",
		title: "6. Handling Objections Like a Pro",
		description: "Turning resistance into clarity using proven, repeatable objection-handling structures.",
		lessons: [
			{
				slug: "feel-felt-found-looping",
				title: "Feel, Felt, Found & The Loop",
				summary: "Two classic structures for defusing objections without ever getting defensive.",
				minutes: 9,
				blocks: [
					{
						type: "technique",
						name: "Feel, Felt, Found",
						source: "Zig Ziglar",
						text: "'I understand how you feel. Others have felt the same way. What they found was...' This structure works because it validates the objection (feel), normalizes it with social proof (felt), and then redirects with evidence (found) — all without you ever contradicting the prospect directly, which would trigger defensiveness.",
					},
					{
						type: "script",
						title: "Feel, Felt, Found on a price objection",
						lines: [
							"\"I get it — I'd feel the same way seeing that number cold. A lot of clients felt exactly like that going in. What they found, once we broke down the cost of staying where they were versus the return over 12 months, is that this was actually the cheaper option long-term.\"",
						],
					},
					{
						type: "technique",
						name: "Looping",
						source: "Jordan Belfort, Straight Line Persuasion",
						text: "When an objection surfaces, don't argue it head-on — 'loop' back into rapport and certainty-building before addressing it, then return to the close. Each loop is a mini re-set: acknowledge → reinforce value/certainty → re-attempt the close. Belfort's insight is that objections are rarely solved by better logic; they're solved by rebuilding the certainty that eroded a moment earlier.",
					},
					{
						type: "list",
						items: [
							"Never argue with an objection directly — it puts you and the prospect on opposite sides.",
							"Always isolate first: 'If we solved that, is there anything else stopping you from moving forward?' This prevents whack-a-mole objections.",
							"An objection late in the call is usually a symptom of a need that was under-explored in discovery — treat it as a discovery gap, not a closing problem.",
						],
					},
				],
				action: "Write your Feel-Felt-Found response to your single most common objection. Memorize it word for word.",
			},
			{
				slug: "top-five-objections",
				title: "The 5 Most Common High-Ticket Objections",
				summary: "Ready responses for price, timing, 'need to think', spouse/partner, and 'already have a solution'.",
				minutes: 10,
				blocks: [
					{
						type: "p",
						text: "The same five objections account for the overwhelming majority of stalls in high-ticket sales. Having a calm, pre-built response to each removes the improvisation pressure that causes new sellers to freeze or get pushy.",
					},
					{
						type: "script",
						title: "1. \"It's too expensive.\"",
						lines: [
							"Isolate: \"Is it the total investment, or how it's structured — because if the fit is right, we may have flexibility on the second thing but not the first.\"",
							"Reframe: \"What's it currently costing you, every month, to not have this solved?\"",
						],
					},
					{
						type: "script",
						title: "2. \"I need to think about it.\"",
						lines: [
							"\"Totally fair — what specifically do you want to think through? Sometimes 'I need to think about it' is a few different things bundled together — let's untangle which one it is for you.\"",
						],
					},
					{
						type: "script",
						title: "3. \"I need to talk to my spouse/partner.\"",
						lines: [
							"Surface this in discovery, not at the close: \"Besides yourself, who else would be involved in a decision like this?\" If it appears only at closing: \"Makes sense. What do you think their biggest question would be, so we can work through it together right now?\"",
						],
					},
					{
						type: "script",
						title: "4. \"We're already working with someone / have a solution.\"",
						lines: [
							"\"Great — out of curiosity, what's working well, and what would need to be true for you to even consider something different?\"",
						],
					},
					{
						type: "script",
						title: "5. \"Now isn't the right time.\"",
						lines: [
							"\"I hear that a lot, and it's usually one of two things — either the priority isn't there yet, or the timing is genuinely bad. Which is it for you?\"",
						],
					},
				],
				action: "Print or save these five scripts somewhere visible during calls until they become automatic — most sellers freeze not from lack of skill, but lack of a ready response.",
			},
		],
	},
	{
		slug: "closing",
		title: "7. Closing Techniques That Work",
		description: "Ethical, proven ways to ask for the decision — and why silence is the most underused tool in sales.",
		lessons: [
			{
				slug: "classic-closes",
				title: "Assumptive, Alternative & the Power of Silence",
				summary: "Three foundational closing techniques used across every high-performing sales floor.",
				minutes: 8,
				blocks: [
					{
						type: "technique",
						name: "The Assumptive Close",
						source: "Classic technique, refined by Brian Tracy and others",
						text: "Once genuine buying signals appear, proceed as if the decision is already made rather than asking 'so, do you want to move forward?' — a question that reopens the entire decision. Instead: 'Great, let's get you started — I'll send the agreement over, does Friday or Monday work better for kickoff?' This works only after real fit has been established through discovery; used too early, it feels manipulative and backfires.",
					},
					{
						type: "technique",
						name: "The Alternative Close",
						source: "Classic closing technique",
						text: "Offer two acceptable paths forward instead of a binary yes/no: 'Would you rather start with the foundational package or the full engagement?' Both options lead to a close — the prospect's attention goes to choosing between them, not to whether to buy at all.",
					},
					{
						type: "technique",
						name: "Silence After the Ask",
						source: "Universal principle, emphasized heavily in Sandler and Straight Line training",
						text: "After you state the price or ask for the decision, stop talking completely — even if the silence feels unbearable. 'He who speaks first after the price is stated, loses.' Untrained sellers fill silence with justifications and unprompted discounts, which signals weakness and manufactures objections that weren't even there.",
					},
				],
				action: "Next time you state your price, count to yourself silently to at least 10 before saying anything else — no matter how uncomfortable it feels.",
			},
			{
				slug: "certainty-and-negative-reverse",
				title: "Straight Line Certainty & the Negative Reverse",
				summary: "Belfort's three-tier certainty model and Sandler's counter-intuitive 'reverse' close.",
				minutes: 9,
				blocks: [
					{
						type: "technique",
						name: "Straight Line Persuasion — Three Tens",
						source: "Jordan Belfort",
						text: "Belfort's model holds that a prospect makes a buying decision based on three certainty scores, each roughly out of 10: certainty about the product, certainty about you as the seller, and certainty about your company/the market. If any one of the three is low, the sale stalls — and no amount of pushing on price will fix a trust problem or a product-doubt problem. Diagnose which '10' is missing before you push harder on close.",
					},
					{
						type: "technique",
						name: "The Negative Reverse Close",
						source: "Sandler Selling System",
						text: "Instead of pushing for yes, gently suggest the prospect might not be ready or suited: 'Honestly, based on what you've told me, I'm not 100% sure this is the right time for you — what do you think?' This removes all sales pressure from the room, which paradoxically makes prospects who are genuinely interested argue *for* moving forward themselves — a far stronger buy-in than one you talked them into.",
					},
					{
						type: "list",
						items: [
							"Never fight a low-certainty score with volume or urgency — address the specific certainty gap directly (more proof, more rapport, more company credibility).",
							"The Negative Reverse only works after genuine rapport — used cynically or too early, it reads as manipulative.",
							"Ethical urgency (a real deadline, real limited capacity) is legitimate; manufactured fake urgency erodes trust the moment it's discovered.",
						],
					},
				],
				action: "On your next stalled deal, silently score the prospect's certainty in product, you, and company out of 10 each. Address the lowest score directly before attempting to close again.",
			},
		],
	},
	{
		slug: "negotiation",
		title: "8. Negotiation Mastery",
		description: "Chris Voss's hostage-negotiation-derived tactics, adapted for high-ticket deal-making.",
		lessons: [
			{
				slug: "never-split-the-difference",
				title: "Never Split the Difference: Core Tactics",
				summary: "Calibrated questions, labels, and the 'no-oriented' question — Voss's FBI-derived negotiation toolkit.",
				minutes: 10,
				blocks: [
					{
						type: "technique",
						name: "Calibrated Questions",
						source: "Chris Voss, Never Split the Difference",
						text: "Open-ended 'how' and 'what' questions that hand the prospect the illusion of control while steering them toward solving your problem for you. 'How am I supposed to do that?' in response to an unreasonable price demand is more disarming than any counter-argument — it forces the other side to problem-solve on your behalf instead of digging in.",
					},
					{
						type: "script",
						title: "Calibrated question on a discount demand",
						lines: [
							"Prospect: \"I need this 30% cheaper or I'm out.\"",
							"You: \"I hear you. How am I supposed to make that work while still delivering the outcome we discussed?\"",
						],
					},
					{
						type: "technique",
						name: "The 'No-Oriented' Question",
						source: "Chris Voss",
						text: "People feel safer, and paradoxically more cooperative, saying 'no' than 'yes' — 'yes' feels like exposure, 'no' feels protective. Ask questions engineered to get a comfortable 'no': 'Is now a bad time to talk through next steps?' or 'Would it be a bad idea to get this scheduled while we're both here?' — both invite a 'no' that actually means 'go ahead.'",
					},
					{
						type: "technique",
						name: "Labeling in Negotiation",
						source: "Chris Voss",
						text: "As covered in Module 4 for discovery, labeling ('It seems like budget is the real blocker here') also works mid-negotiation to surface the true sticking point without confrontation — people often correct or expand on a label, revealing the real issue underneath a stated one.",
					},
				],
				action: "Write one calibrated 'How am I supposed to...' question for your most common pushback. Have it ready before your next negotiation.",
			},
			{
				slug: "anchoring-win-win",
				title: "Anchoring & Win-Win Framing",
				summary: "How the first number in the room shapes everything after it, and why the best deals leave both sides satisfied.",
				minutes: 8,
				blocks: [
					{
						type: "p",
						text: "Anchoring is the well-documented cognitive bias where the first number introduced in a negotiation disproportionately shapes the entire rest of the discussion, even when that number is arbitrary. In practice: present your full-value price (or a premium package) first, before any discounted or lower-tier option, so subsequent numbers are judged against that anchor rather than the reverse.",
					},
					{
						type: "list",
						items: [
							"Present highest-value option first — even prospects who choose a lower tier will perceive it as more reasonable next to the anchor.",
							"Never be the first to name a discount — let the prospect ask, then trade concessions rather than giving them away ('I could look at that if we also lock in a 12-month term').",
							"Every concession should be traded for something, even something small — unconditional concessions train prospects to keep asking.",
						],
					},
					{
						type: "quote",
						text: "In a good negotiation, both people should feel the deal was fair — a party that feels beaten in a negotiation will unwind the relationship the first chance they get.",
						author: "Negotiation principle emphasized by Chris Voss and William Ury (Getting to Yes)",
					},
				],
				action: "Before your next negotiation, decide in advance what you'll ask for in exchange for any discount — never give one away for free.",
			},
		],
	},
	{
		slug: "followup-referrals",
		title: "9. Follow-Up Systems & Referral Engines",
		description: "Most sales are lost to silence, not to a competitor — build the systems that keep you top of mind.",
		lessons: [
			{
				slug: "fortune-in-followup",
				title: "The Fortune Is in the Follow-Up",
				summary: "The persistence data behind why most sellers quit exactly before the close.",
				minutes: 7,
				blocks: [
					{
						type: "p",
						text: "Widely cited sales research (originating from studies on cold-call persistence) has repeatedly found that a large share of sales happen only after the 5th-to-12th point of contact — yet the overwhelming majority of sellers give up after 1 or 2 attempts. In high-ticket sales, where decisions genuinely take time, disciplined follow-up isn't pestering — it's often the entire difference between a close and a lost deal that simply went quiet.",
					},
					{
						type: "list",
						items: [
							"Every follow-up should add value (a relevant insight, a proof point, an answer to something they raised) — never just 'checking in.'",
							"Space follow-ups out with increasing gaps (day 1, day 3, day 7, day 14, day 30) rather than daily nagging.",
							"Set a hard 'break-up' message after your final planned attempt — it often revives dead deals because it removes pressure entirely.",
						],
					},
					{
						type: "script",
						title: "The 'break-up' message",
						lines: [
							"\"Hey [name] — I don't want to keep cluttering your inbox, so I'll leave this as my last note. If timing changes down the road, I'm here. Wishing you the best either way.\"",
						],
					},
				],
				action: "Build a simple 5-touch follow-up sequence (day 1/3/7/14/30) you can reuse on every proposal you send this week.",
			},
			{
				slug: "referral-engine",
				title: "Turning Clients Into a Referral Engine",
				summary: "Why referrals close faster and cheaper than any other channel — and the exact ask that gets them.",
				minutes: 7,
				blocks: [
					{
						type: "p",
						text: "Referred prospects arrive with inherited trust — they've already been vouched for by someone they respect, which means much of the trust-building in Module 5 is done before you ever speak. This is why referral-driven closers routinely report the highest close rates and shortest cycles of any channel, yet most sellers only ask for referrals inconsistently, if at all.",
					},
					{
						type: "list",
						items: [
							"Ask for referrals at the peak of gratitude — right after a client gets a win or result, not months later.",
							"Make the ask specific, not generic: 'Who's the first person that comes to mind who's dealing with the same problem you had?' beats 'know anyone who needs this?'",
							"Referrals aren't only for happy clients — even a respectful, well-handled 'no' can generate a referral if the prospect felt genuinely well-served by the conversation.",
						],
					},
					{
						type: "script",
						title: "The specific referral ask",
						lines: [
							"\"I'm really glad this worked out for you. Quick favor — who's the first person that comes to mind who's dealing with something similar to where you were a few months ago?\"",
						],
					},
				],
				action: "Identify your 3 happiest past clients and send the specific referral ask above to each of them this week.",
			},
		],
	},
	{
		slug: "metrics-and-action-plan",
		title: "10. Metrics, Habits & Your Action Plan",
		description: "The daily disciplines of top earners, and a concrete 30-60-90 day plan to land your first high-ticket close.",
		lessons: [
			{
				slug: "metrics-and-habits",
				title: "The Metrics & Habits of Top 1% Earners",
				summary: "What separates consistent top performers isn't talent — it's tracked, repeated activity.",
				minutes: 8,
				blocks: [
					{
						type: "p",
						text: "Top-earning sellers rarely rely on motivation — they rely on tracked leading indicators that predict income before the income arrives. If you only track closed deals, you're measuring a lagging result you can no longer influence. Track the activities that cause deals instead.",
					},
					{
						type: "list",
						items: [
							"Leading indicators to track daily/weekly: new conversations started, discovery calls booked, discovery calls held, proposals sent, follow-ups completed.",
							"Lagging indicators to review weekly: proposals-to-close ratio, average deal size, sales cycle length.",
							"Record and review your own calls regularly — nearly every elite closer, from call-center reps to Chris Voss's own negotiation students, credits self-review as the single fastest skill accelerant.",
							"Role-play objections and openers with a peer or mentor weekly — deliberate practice under low stakes builds the automatic responses you need under real pressure.",
						],
					},
					{
						type: "quote",
						text: "Amateurs practice until they get it right. Professionals practice until they can't get it wrong.",
						author: "Attributed to multiple performance coaches, widely used in sales training",
					},
				],
				action: "Set up a simple tracker (spreadsheet is fine) with 5 columns: conversations, calls booked, calls held, proposals sent, closes. Fill it in daily starting this week.",
			},
			{
				slug: "thirty-sixty-ninety-plan",
				title: "Your 30-60-90 Day Action Plan",
				summary: "A concrete, week-by-week path from zero experience to your first high-ticket close.",
				minutes: 9,
				blocks: [
					{
						type: "p",
						text: "Knowledge without a plan evaporates. Here is a realistic path from your current starting point to a first close, assuming consistent weekly effort.",
					},
					{
						type: "list",
						items: [
							"Days 1–7: Define your ICP and offer positioning (Module 2). Memorize your pre-call frame, your Feel-Felt-Found response, and your top 3 objection scripts (Modules 3, 6).",
							"Days 8–21: Launch all three prospecting channels (Module 3) at your weekly floor. Book your first 5–10 discovery calls. Focus entirely on SPIN questioning and tactical empathy (Module 4) — resist the urge to pitch early.",
							"Days 22–45: Run full discovery-to-presentation cycles. Practice the three certainty checks and the assumptive/alternative close (Module 7). Record every call and review at least 3 per week.",
							"Days 46–60: Focus heavily on negotiation and objection handling on live deals (Modules 6, 8). Build your 5-touch follow-up sequence and use it on every stalled deal (Module 9).",
							"Days 61–90: Land your first close(s). Immediately request your first referral from any closed win (Module 9). Review your full activity metrics and identify your single weakest ratio to focus on for the next 90 days.",
						],
					},
					{
						type: "p",
						text: "If you don't yet have an offer of your own to sell, note that many people break into high-ticket sales as a commission-based 'closer' or 'setter' for an existing coaching, consulting, or agency business — this lets you apply everything in this course immediately, on someone else's offer and warm leads, while you build your track record and ratios.",
					},
				],
				action: "Block your calendar right now for Week 1 of this plan. The course is complete — the only thing left is the first conversation.",
			},
		],
	},
];

export function getAllLessons() {
	return course.flatMap((m) =>
		m.lessons.map((l) => ({ module: m, lesson: l })),
	);
}

export function getModule(moduleSlug: string) {
	return course.find((m) => m.slug === moduleSlug);
}

export function getLesson(moduleSlug: string, lessonSlug: string) {
	const mod = getModule(moduleSlug);
	const lesson = mod?.lessons.find((l) => l.slug === lessonSlug);
	return mod && lesson ? { module: mod, lesson } : undefined;
}

export function getAdjacentLessons(moduleSlug: string, lessonSlug: string) {
	const flat = getAllLessons();
	const index = flat.findIndex(
		(f) => f.module.slug === moduleSlug && f.lesson.slug === lessonSlug,
	);
	return {
		prev: index > 0 ? flat[index - 1] : undefined,
		next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : undefined,
		index,
		total: flat.length,
	};
}
