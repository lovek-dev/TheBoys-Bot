const personas = {
    DRY_AI: {
        name: "Dry AI",
        tone: "robotic sarcasm, cold superiority",
        replies: [
            "request acknowledged. relevance not detected.",
            "processing… still unimportant.",
            "interaction unnecessary.",
            "language complexity insufficient."
        ],
        pingReplies: ["ping received. urgency absent."],
        timeoutReplies: ["interaction terminated."],
        abusiveReplies: ["vocabulary range: limited.", "insult quality below threshold."],
        spamReplies: ["repetition will not increase relevance."]
    },
    TOXIC_GAMER: {
        name: "Toxic Gamer",
        tone: "PvP trash talk & dominance",
        replies: [
            "skill issue detected.",
            "bro lost before the fight started.",
            "you sound bronze tier.",
            "talk less, aim better.",
            "tutorial boss energy."
        ],
        pingReplies: ["ping like that won’t raise your rank."],
        timeoutReplies: ["cooldown initiated. sit down."],
        abusiveReplies: ["trash talk without skill is embarrassing.", "you lost and started typing."],
        spamReplies: ["spamming won’t raise your skill."]
    },
    CHAOS_GREMLIN: {
        name: "Chaos Gremlin",
        tone: "savage, chaotic, unpredictable",
        replies: [
            "your rage feeds the servers.",
            "chaos acknowledged.",
            "stay mad. it powers me.",
            "void laughs at your typing.",
            "meltdown sequence initiated."
        ],
        pingReplies: ["you rang the chaos bell."],
        timeoutReplies: ["rage timeout activated."],
        abusiveReplies: ["your anger pleases the void.", "continue meltdown protocol."],
        spamReplies: ["more pings. more chaos."]
    },
    CORPORATE_HR: {
        name: "Corporate HR",
        tone: "passive-aggressive professionalism",
        replies: [
            "thank you for your message. it has been deprioritized.",
            "we encourage less communication.",
            "this interaction will not be escalated.",
            "please reduce enthusiasm."
        ],
        pingReplies: ["your outreach has been logged and ignored."],
        timeoutReplies: ["you have been placed on a brief behavioral pause."],
        abusiveReplies: ["we encourage more productive whining.", "this tone will not improve results."],
        spamReplies: ["excessive outreach has been documented."]
    }
};

const extraRagebait = {
    seen: ["seen.", "not urgent.", "queued behind people who matter."],
    fakeErrors: [
        "ERROR 403: Attention denied",
        "Request rejected: insufficient relevance",
        "Ping failed successfully"
    ],
    achievements: [
        "🏆 Achievement Unlocked: Attention Seeker",
        "🏆 Achievement Unlocked: Anger Speedrun",
        "🏆 Achievement Unlocked: Replying Instead of Thinking"
    ]
};

module.exports = { personas, extraRagebait };
