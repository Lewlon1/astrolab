// DRAFT — Gabs to edit
// The card × your Big Three. One entry per card: an intro, one line each for Sun,
// Moon and Rising (with the sign slotted in), and the Lab's reflection.
// Modelled on Gabs's example, "The Star × Your Big Three" (the Star entry follows it
// most closely). Sun = how you move through life, Moon = how you respond and settle,
// Rising = how you meet the world. Every line is a prompt to notice, never a cause.
//
// Placeholders: {sign} (the placement's sign, or "X or Y"), {card}. Filled with lensText().
import type { Card } from "./cards";

export type BigThreeEntry = {
  /** Opens the chart section: what the card speaks to, then the turn to the chart. */
  intro: string;
  Sun: string;
  Moon: string;
  Rising: string;
  /** "The Lab's reflection": closes the Big Three with one or two questions. */
  reflection: string;
};

export const BIG_THREE_PLACEHOLDERS = ["sign", "card"] as const;

const TURN = "But what might that look like through your chart?";

/** Keyed by card name; content tests check every card in CARDS has an entry. */
export const BIG_THREE: Record<Card["name"], BigThreeEntry> = {
  "The Fool": {
    intro: `The Fool speaks to beginnings, curiosity and stepping forward before you have every answer. ${TURN}`,
    Sun: "Your {sign} Sun describes how you tend to move towards something new. {card} asks whether that way of beginning leaves room for not knowing yet, or whether you only start once the path feels safe enough.",
    Moon: "Emotionally, your {sign} Moon may meet the unknown with excitement, unease or a little of both. When a beginning feels uncertain, what helps you stay curious rather than reaching for reassurance too early?",
    Rising: "With {sign} Rising, people may see your fresh starts before you've decided how you feel about them. Notice how you present something new: openly, cautiously, or only once it's already working.",
    reflection: "Where are you waiting for certainty before you let yourself begin? And what is one small first step you could take this week without knowing exactly where it leads?",
  },
  "The Magician": {
    intro: `The Magician speaks to agency, skill and using what's already in your hands. ${TURN}`,
    Sun: "Your {sign} Sun shows the kind of resourcefulness that comes most naturally to you. {card} invites you to notice where you already have enough to begin, and where you keep waiting for better tools.",
    Moon: "With your {sign} Moon, your emotional state may shape how capable you feel on any given day. It's worth asking: when you feel unsettled, do you underestimate what you can do, or try to fix everything at once?",
    Rising: "With {sign} Rising, others may see you as more ready than you feel. The interesting question is whether you can let that impression support you rather than add pressure.",
    reflection: "What is already within reach that you haven't fully used yet? And what would it look like to act on it this week, before the conditions feel perfect?",
  },
  "The High Priestess": {
    intro: `The High Priestess speaks to intuition, inner knowing and what hasn't yet been put into words. ${TURN}`,
    Sun: "Your {sign} Sun shapes how you make sense of what you can't yet explain. {card} invites you to notice when you trust a quiet sense of things, and when you override it in favour of what's easier to justify.",
    Moon: "Your {sign} Moon may give you your own way of sensing what's going on beneath the surface. When something feels off but you can't say why, do you give it time, or talk yourself out of it?",
    Rising: "With {sign} Rising, others may not always see how much you're taking in. Notice what you keep to yourself, and whether that privacy protects your intuition or keeps it unheard.",
    reflection: "What do you sense right now that you haven't said out loud, even to yourself? And how could you give it a little more space this week before deciding what it means?",
  },
  "The Empress": {
    intro: `The Empress speaks to nourishment, creativity and the ability to receive. ${TURN}`,
    Sun: "Your {sign} Sun describes what helps you feel creative and alive. {card} asks where you let yourself enjoy that freely, and where you've made it something you have to earn first.",
    Moon: "With your {sign} Moon, care may feel most real in particular forms. Notice how easily you receive it from others, compared with how readily you offer it.",
    Rising: "With {sign} Rising, people may experience you as a source of warmth or support. The question is whether there's room in your life for that care to flow back towards you.",
    reflection: "Where are you giving more than you're allowing yourself to receive? And what is one small way you could let yourself be looked after this week?",
  },
  "The Emperor": {
    intro: `The Emperor speaks to structure, authority and having something solid to lean on. ${TURN}`,
    Sun: "Your {sign} Sun shapes the kind of order that feels natural to you. {card} invites you to look at which of your rules are genuinely yours, and which you keep out of habit.",
    Moon: "Your {sign} Moon may look for steadiness in its own way. When life feels unpredictable, does structure calm you, or does it become a way of holding everything too tightly?",
    Rising: "With {sign} Rising, others may read you as more in control than you feel. Notice whether that image gives you confidence or makes it harder to ask for support.",
    reflection: "Which structures in your life are supporting you right now, and which are keeping you in place? What is one rule you could loosen, or one boundary you could strengthen, this week?",
  },
  "The Hierophant": {
    intro: `The Hierophant speaks to shared values, tradition and the beliefs we inherit. ${TURN}`,
    Sun: "Your {sign} Sun describes how you relate to the values you were raised with. {card} invites you to notice which beliefs you've chosen for yourself, and which you've simply carried forward.",
    Moon: "With your {sign} Moon, belonging may feel safest in particular kinds of community. It's worth asking whether the groups you lean on still reflect who you are now.",
    Rising: "With {sign} Rising, others may see you as someone who fits in, or as someone who quietly doesn't. Notice where you adapt to be accepted, and what that costs you.",
    reflection: "Which belief have you never really questioned, and does it still belong to you? Who could you talk it through with this week, someone who sees things differently?",
  },
  "The Lovers": {
    intro: `The Lovers speak to connection, choice and acting in line with what you value. ${TURN}`,
    Sun: "Your {sign} Sun shapes what you look for in a meaningful connection. {card} asks whether your recent choices reflect those values, or the ones you think you should have.",
    Moon: "Your {sign} Moon may need particular things to feel close to someone. Notice whether you ask for those things directly, or hope they'll be noticed without you having to say so.",
    Rising: "With {sign} Rising, people may form a first impression of how available or guarded you are. The question is whether that impression matches what you actually want.",
    reflection: "What choice about connection or commitment is asking for your attention? And what would it look like to make it based on your values rather than on fear of getting it wrong?",
  },
  "The Chariot": {
    intro: `The Chariot speaks to direction, momentum and holding competing priorities together. ${TURN}`,
    Sun: "Your {sign} Sun describes the kind of drive that comes naturally to you. {card} invites you to notice whether you're steering, or being pulled between two things you haven't yet reconciled.",
    Moon: "With your {sign} Moon, your feelings may pull in a different direction from your plans. Rather than choosing one, what happens if you let both inform the way forward?",
    Rising: "With {sign} Rising, others may see you as focused even when you feel divided. Notice where you're performing certainty, and where you're actually moving forward.",
    reflection: "Which two priorities are competing for your energy right now? What is one decision this week that could let them work together rather than against each other?",
  },
  Strength: {
    intro: `Strength speaks to patience, emotional steadiness and responding without forcing an outcome. ${TURN}`,
    Sun: "Your {sign} Sun shapes what strength looks like for you. {card} invites you to notice the quieter kind: staying with something difficult rather than pushing through it.",
    Moon: "Your {sign} Moon may have its own way of steadying itself under pressure. When emotions run high, what helps you respond rather than react?",
    Rising: "With {sign} Rising, others may see your strength in one particular form. Notice whether there's a softer, steadier side of you that rarely gets seen.",
    reflection: "Where are you trying to force an outcome that might respond better to patience? What is one moment this week where you could pause before you act?",
  },
  "The Hermit": {
    intro: `The Hermit speaks to solitude, reflection and the need to hear yourself again. ${TURN}`,
    Sun: "Your {sign} Sun describes how you find your own sense of direction. {card} invites you to notice whether stepping back is helping you reconnect, or making it easier to avoid something.",
    Moon: "With your {sign} Moon, time alone may restore you in particular ways. It's worth asking which kinds of solitude actually help you settle, and which simply keep feelings at a distance.",
    Rising: "With {sign} Rising, others may not realise how much space you need. Notice how you ask for it, if you ask for it at all.",
    reflection: "What do you need some quiet to hear right now? And how could you protect a small pocket of time for it this week, without disappearing altogether?",
  },
  "Wheel of Fortune": {
    intro: `Wheel of Fortune speaks to change, cycles and the parts of life you can't fully control. ${TURN}`,
    Sun: "Your {sign} Sun shapes how you tend to meet the unexpected. {card} invites you to notice where you resist change, and where you're already adapting more than you give yourself credit for.",
    Moon: "Your {sign} Moon may respond to uncertainty in its own way. When the familiar shifts, what helps you feel steady enough to stay open?",
    Rising: "With {sign} Rising, others may see you as more adaptable, or more fixed, than you feel inside. Notice what you show when plans change.",
    reflection: "What change are you meeting right now that you didn't fully choose? What is one thing within your control this week that could help you respond rather than brace?",
  },
  Justice: {
    intro: `Justice speaks to fairness, accountability and seeing a situation clearly. ${TURN}`,
    Sun: "Your {sign} Sun describes your sense of what's fair. {card} invites you to look at the facts of a situation, including your own part in it, before deciding what needs to change.",
    Moon: "With your {sign} Moon, imbalance may register in your body or mood before you can name it. When something feels unfair, do you speak up, withdraw, or try to smooth it over?",
    Rising: "With {sign} Rising, others may see you as the reasonable one. Notice whether that role leaves room for your own needs in the balance.",
    reflection: "Where does something feel out of balance in your life right now? What would a fair next step look like, for you as well as for everyone else involved?",
  },
  "The Hanged Man": {
    intro: `The Hanged Man speaks to pausing, surrender and seeing things from a different angle. ${TURN}`,
    Sun: "Your {sign} Sun shapes how comfortable you are with waiting. {card} invites you to notice what becomes visible when you stop trying to make things happen on your timeline.",
    Moon: "Your {sign} Moon may find stillness easier in some situations than others. When you're stuck in between, does pausing feel like rest, or like losing ground?",
    Rising: "With {sign} Rising, others may see you as keeping busy even when you feel suspended. Notice what you'd see if you let yourself stop for a moment.",
    reflection: "Where are you trying to force an answer that might come more clearly from a different perspective? What could you deliberately leave unresolved this week?",
  },
  Death: {
    intro: `Death speaks to endings, transformation and making space for what comes next. ${TURN}`,
    Sun: "Your {sign} Sun describes how you tend to let go. {card} invites you to notice what may be reaching the end of its current form, even if part of you would rather hold on.",
    Moon: "With your {sign} Moon, endings may stir up particular feelings. It's worth asking what you need in order to grieve what's changing, not just move past it.",
    Rising: "With {sign} Rising, others may see you as coping well with change. Notice whether there's something you're carrying that hasn't had space to be acknowledged.",
    reflection: "What is ending, or ready to end, in your life right now? And what is one way you could honour what it gave you before turning towards what comes next?",
  },
  Temperance: {
    intro: `Temperance speaks to balance, integration and a more sustainable rhythm. ${TURN}`,
    Sun: "Your {sign} Sun shapes what feels like the right pace for you. {card} invites you to notice where you swing between all and nothing, and what a steadier middle might look like.",
    Moon: "Your {sign} Moon may have its own way of finding equilibrium. When life pulls in different directions, what helps you feel whole rather than split?",
    Rising: "With {sign} Rising, others may see you as balanced even when you're stretched. Notice which parts of your life rarely get to share the same space.",
    reflection: "Where are you living in extremes right now? What is one small adjustment this week that could help two parts of your life coexist more easily?",
  },
  "The Devil": {
    intro: `The Devil speaks to attachment, habit and the patterns that have a hold on us. ${TURN}`,
    Sun: "Your {sign} Sun describes what you tend to hold onto. {card} invites you to look honestly at a pattern that feels fixed, and at how much choice you might actually have.",
    Moon: "With your {sign} Moon, certain habits may offer comfort when you feel unsettled. It's worth asking which of them still soothe you, and which have started to cost more than they give.",
    Rising: "With {sign} Rising, others may not see the patterns you struggle with most. Notice where you keep up appearances, and what you'd do differently if no one were watching.",
    reflection: "Which habit or attachment feels like it has more control than you do right now? What is one small way you could test how much choice you really have this week?",
  },
  "The Tower": {
    intro: `The Tower speaks to disruption, revelation and what was never as stable as it seemed. ${TURN}`,
    Sun: "Your {sign} Sun shapes what you've built your sense of security around. {card} invites you to notice which assumption no longer holds, even if letting it go feels uncomfortable.",
    Moon: "Your {sign} Moon may react to sudden change in its own way. When something gets shaken loose, what helps you steady yourself without rushing to rebuild the same thing?",
    Rising: "With {sign} Rising, others may see you as unshaken. Notice whether that image is making it harder to admit that something needs to change.",
    reflection: "What in your life was built on an assumption that no longer feels true? What might it reveal if you let it be reconsidered rather than defended?",
  },
  "The Star": {
    intro: `The Star speaks to hope, renewal and the possibility of reconnecting with a sense of direction. ${TURN}`,
    Sun: "The Star's symbolism may resonate with your {sign} Sun in its own way: the part of you that wants to believe in something beyond what is immediately visible. The invitation is to distinguish meaningful hope from idealising what could be.",
    Moon: "Emotionally, your {sign} Moon may connect with The Star through its themes of faith, possibility and looking ahead. When you feel uncertain, does finding a bigger perspective help you process your emotions, or sometimes distract you from what you're feeling right now?",
    Rising: "With {sign} Rising, The Star's message of renewal meets the way you approach life day to day. Perhaps hope becomes most meaningful when you can translate it into something tangible: a routine, a decision, a boundary or a small act of care.",
    reflection: "Where are you being invited to trust in possibility without losing touch with reality? And what is one small, tangible action that could help you bring that hope into your everyday life?",
  },
  "The Moon": {
    intro: `The Moon speaks to uncertainty, imagination and the fears that surface when things aren't clear. ${TURN}`,
    Sun: "Your {sign} Sun shapes how you navigate what you can't yet see. {card} invites you to notice the difference between a genuine intuition and a story you've told yourself to fill the gap.",
    Moon: "With your {sign} Moon, old fears may surface in familiar forms when things feel unclear. What helps you stay with the uncertainty long enough to see what's really there?",
    Rising: "With {sign} Rising, others may see you as more certain than you feel. Notice whether you're projecting clarity to avoid admitting what you don't yet know.",
    reflection: "What are you unsure about right now, and what story have you been telling yourself about it? What is one fact you could check this week before deciding what it means?",
  },
  "The Sun": {
    intro: `The Sun speaks to openness, joy and the freedom to take up space. ${TURN}`,
    Sun: "Your {sign} Sun describes where you feel most like yourself. {card} invites you to notice where you let that show freely, and where you still edit or minimise it.",
    Moon: "Your {sign} Moon may find joy in particular kinds of moments. It's worth asking how often you make room for them, rather than treating them as a reward for getting everything else done.",
    Rising: "With {sign} Rising, the first version of you that others meet may be brighter, or more guarded, than you feel. Notice who gets to see you fully at ease.",
    reflection: "Where do you feel most like yourself, without needing to adjust? What is one way you could take up a little more space there this week?",
  },
  Judgement: {
    intro: `Judgement speaks to reflection, renewal and seeing your past with new understanding. ${TURN}`,
    Sun: "Your {sign} Sun shapes how you look back on who you've been. {card} invites you to notice what you understand now that you couldn't see then, rather than judging your past self by today's standards.",
    Moon: "With your {sign} Moon, an old memory or feeling may be asking for a different kind of attention. When it returns, can you meet it with curiosity rather than criticism?",
    Rising: "With {sign} Rising, others may still see a version of you that you've outgrown. Notice whether you're ready to show them who you've become.",
    reflection: "What from your past is asking to be seen differently? And what would you say to the version of you who lived through it, knowing what you know now?",
  },
  "The World": {
    intro: `The World speaks to completion, integration and reaching a meaningful milestone. ${TURN}`,
    Sun: "Your {sign} Sun describes what feels like real achievement to you. {card} invites you to take stock of what this chapter has taught you before rushing towards the next one.",
    Moon: "Your {sign} Moon may experience endings and arrivals in its own way. It's worth asking whether you let yourself feel the satisfaction of finishing, or move on before it lands.",
    Rising: "With {sign} Rising, others may already be asking what's next. Notice whether you can pause long enough to acknowledge how far you've come.",
    reflection: "What chapter in your life is coming to a close, and what has it taught you? How could you mark that completion this week before deciding what comes next?",
  },
};

