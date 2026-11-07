require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    SlashCommandBuilder,
    MessageFlags,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// ======================================================
// CONFIG
// ======================================================

const TOKEN = process.env.DISCORD_TOKEN;

const CLIENT_ID = "1566432269025943592";
const GUILD_ID = "1557369608170905670";

// ======================================================
// CHANNELS
// ======================================================

const PARTNERSHIP_CHANNEL_ID = "1558473199098921042";
const PAID_AD_CHANNEL_ID = "1558473196053987388";
const LOG_CHANNEL_ID = "1558473289591029851";
const APPLICATION_PANEL_CHANNEL_ID = "1558731987261329409";
const APPLICATION_SUBMISSIONS_CHANNEL_ID = "1558731905963130890";
const TIMEZONE_CHANNEL_ID = "1566007619968172122";
const TICKET_LOG_CHANNEL_ID = "1558473266413305886";

const TICKET_PANEL_CHANNEL_ID = "1558473182476763334";

const WELCOME_CHANNEL_ID = "1565891261871693895";
const INVITE_CHANNEL_ID = "1566067137775403059";
const VERIFICATION_CHANNEL_ID = "1558745120394838067";
const REACTION_ROLE_CHANNEL_ID = "1558473179905786006";

const QOTD_CHANNEL_ID = "1558473206418116678";
const INFRACTION_CHANNEL_ID = "1558473256921731123";
const PROMOTION_CHANNEL_ID = "1558473255751262248";

const MOD_LOG_CHANNEL_ID = LOG_CHANNEL_ID;

// ======================================================
// ROLES
// ======================================================

const STAFF_ROLE_ID = "1557375177543778404";
const PARTNERSHIP_REP_ROLE_ID = "1557801601505304657";

const OWNER_ROLE_ID = "1561367764071878737";
const ADMIN_ROLE_ID = "1561367792253669386";
const MOD_ROLE_ID = "1561367826844094474";
const MEMBER_ROLE_ID = "1561367860616503316";

const PURCHASE_ROLE_ID = "1558672561192308786";
const HIGH_RANK_ROLE_ID = "1558478758997131425";

const SHR_ROLE_IDS = [
    "1558477508129849434",
    "1558477281293377658"
];

const VERIFICATION_ROLE_ID = "1566308232119722025";

const GIVEAWAY_HOST_ROLE_ID = "1567115692430331954";

const APPLICATION_REVIEWERS = {
    lr: ["1558477508129849434"],
    support: ["1558477508129849434"],
    hr: ["1558477508129849434"],
    shr: ["1557720153096061028", "1558477281293377658"]
};

const TIMEZONE_ROLE_PREFIX = "UTC";
const TIMEZONE_ROLE_FILE = path.join(__dirname, "timezone_roles.json");
let timezoneRoleMap = loadJSON(TIMEZONE_ROLE_FILE, {});
const applicationDrafts = new Map();
const TIMEZONE_PAGE_SIZE = 25;


const STAFF_ROLE_IDS = new Set([
    STAFF_ROLE_ID,
    PURCHASE_ROLE_ID,
    HIGH_RANK_ROLE_ID,
    ...SHR_ROLE_IDS,
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID
]);

// ======================================================
// TICKET CONFIG
// ======================================================

const TICKET_CATEGORIES = {
    general: {
        name: "General Support",
        emoji: "🛠️",
        categoryId: "1558473176768454696",
        roles: [STAFF_ROLE_ID]
    },

    purchase: {
        name: "Purchase Ticket",
        emoji: "🛒",
        categoryId: "1558473177552654459",
        roles: [PURCHASE_ROLE_ID]
    },

    paidad: {
        name: "Paid Ad Ticket",
        emoji: "💰",
        categoryId: "1558473178903347331",
        roles: [PURCHASE_ROLE_ID]
    },

    highrank: {
        name: "High Rank Ticket",
        emoji: "👑",
        categoryId: "1558725667179331654",
        roles: [HIGH_RANK_ROLE_ID]
    },

    shr: {
        name: "SHR Ticket",
        emoji: "⭐",
        categoryId: "1558725875392974920",
        roles: SHR_ROLE_IDS
    }
};

const ESCALATION_ROLES = SHR_ROLE_IDS;

// ======================================================
// DATA FILES
// ======================================================

const DATA_DIR = __dirname;

const TICKET_FILE = path.join(DATA_DIR, "ticket_data.json");
const INVITE_FILE = path.join(DATA_DIR, "invites.json");
const INFRACTION_FILE = path.join(DATA_DIR, "infractions.json");
const GIVEAWAY_FILE = path.join(DATA_DIR, "giveaways.json");
const VERIFICATION_FILE = path.join(DATA_DIR, "verification_data.json");
const REACTION_FILE = path.join(DATA_DIR, "reaction_roles.json");

function loadJSON(file, fallback) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
            return fallback;
        }

        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        console.error(`Failed loading ${path.basename(file)}:`, error);
        return fallback;
    }
}

function saveJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Failed saving ${path.basename(file)}:`, error);
    }
}

let ticketData = loadJSON(TICKET_FILE, {
    tickets: {},
    panelMessageId: null
});

let inviteData = loadJSON(INVITE_FILE, {
    users: {}
});

let infractions = loadJSON(INFRACTION_FILE, {
    users: {}
});

let giveaways = loadJSON(GIVEAWAY_FILE, {});

let verificationData = loadJSON(VERIFICATION_FILE, {
    panelMessageId: null
});

let reactionRoles = loadJSON(REACTION_FILE, {
    messageId: null,
    roles: {}
});

// ======================================================
// CLIENT
// ======================================================

if (!TOKEN) {
    console.error("❌ DISCORD_TOKEN is missing from .env");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildInvites
    ],

    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

// ======================================================
// INVITE CACHE
// ======================================================

const inviteCache = new Map();

// ======================================================
// HELPERS
// ======================================================

function isStaff(member) {
    if (!member) return false;

    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    return [...STAFF_ROLE_IDS].some(id =>
        member.roles.cache.has(id)
    );
}

function isOwner(member) {
    return member?.roles?.cache?.has(OWNER_ROLE_ID) ||
        member?.permissions?.has(PermissionFlagsBits.Administrator);
}

function canModerate(member, target) {
    if (!member || !target) return false;

    if (target.id === member.id) return false;

    if (target.id === member.guild.ownerId) return false;

    if (target.id === client.user.id) return false;

    if (
        member.roles.highest.comparePositionTo(
            target.roles.highest
        ) <= 0
    ) {
        return false;
    }

    return true;
}

function hasRole(member, roleId) {
    return member?.roles?.cache?.has(roleId);
}

function canEscalate(member) {
    return ESCALATION_ROLES.some(id =>
        member.roles.cache.has(id)
    );
}

async function sendLog(embed) {
    try {
        const channel = await client.channels.fetch(
            MOD_LOG_CHANNEL_ID
        );

        if (!channel?.isTextBased()) return;

        await channel.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error("Logging error:", error);
    }
}

function parseDuration(input) {
    if (!input) return null;

    const match = input
        .toLowerCase()
        .trim()
        .match(/^(\d+)\s*(s|m|h|d|w)$/);

    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2];

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];
}

function safeText(text, max = 1000) {
    return String(text || "")
        .replace(/`/g, "")
        .slice(0, max);
}

function formatDuration(ms) {
    if (ms < 1000) return "0s";

    const seconds = Math.floor(ms / 1000);

    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h`;
    }

    return `${Math.floor(hours / 24)}d`;
}

// ======================================================
// TICKET LOGGING
// ======================================================

async function sendTicketLog(embed, files = []) {
    const channel = await client.channels.fetch(TICKET_LOG_CHANNEL_ID).catch(() => null);
    if (!channel?.isTextBased()) return;
    await channel.send({ embeds: [embed], files }).catch(error => console.error("Ticket log error:", error));
}

// ======================================================
// TICKET HELPERS
// ======================================================

function getTicket(channelId) {
    return ticketData.tickets[channelId] || null;
}

function hasTicketStaffRole(member, ticketType) {
    if (!member) return false;

    const config = TICKET_CATEGORIES[ticketType];

    if (!config) return false;

    return config.roles.some(roleId =>
        member.roles.cache.has(roleId)
    );
}

// ======================================================
// TICKET BUTTONS
// ======================================================

function buildTicketButtons(type, claimed) {
    const row1 = new ActionRowBuilder();

    row1.addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel(claimed ? "Claimed" : "Claim")
            .setEmoji("🙋")
            .setStyle(
                claimed
                    ? ButtonStyle.Secondary
                    : ButtonStyle.Primary
            )
            .setDisabled(Boolean(claimed)),

        new ButtonBuilder()
            .setCustomId("ticket_unclaim")
            .setLabel("Unclaim")
            .setEmoji("↩️")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_close_request")
            .setLabel("Close Request")
            .setEmoji("📝")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Close")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder();

    row2.addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_info")
            .setLabel("Ticket Info")
            .setEmoji("ℹ️")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_rename")
            .setLabel("Rename")
            .setEmoji("✏️")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_add")
            .setLabel("Add Member")
            .setEmoji("➕")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_remove")
            .setLabel("Remove Member")
            .setEmoji("➖")
            .setStyle(ButtonStyle.Secondary)
    );

    const row3 = new ActionRowBuilder();

    row3.addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_lock")
            .setLabel("Lock")
            .setEmoji("🔐")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("ticket_transcript")
            .setLabel("Transcript")
            .setEmoji("📄")
            .setStyle(ButtonStyle.Secondary)
    );

    const rows = [row1, row2, row3];

    if (type === "shr") {
        rows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_escalate")
                    .setLabel("Escalate")
                    .setEmoji("⬆️")
                    .setStyle(ButtonStyle.Primary)
            )
        );
    }

    return rows;
}

// ======================================================
// AUTO TICKET PANEL
// ======================================================

async function sendTicketPanel(channel) {
    if (!channel?.isTextBased()) return;

    if (ticketData.panelMessageId) {
        try {
            const existing =
                await channel.messages.fetch(
                    ticketData.panelMessageId
                );

            if (
                existing &&
                existing.author.id === client.user.id
            ) {
                return existing;
            }
        } catch {
            ticketData.panelMessageId = null;
        }
    }

    const recent = await channel.messages.fetch({
        limit: 50
    }).catch(() => null);

    if (recent) {
        const existing = recent.find(message =>
            message.author.id === client.user.id &&
            message.embeds.some(embed =>
                embed.title === "🎫 AKSH'S ADVERTISING"
            )
        );

        if (existing) {
            ticketData.panelMessageId = existing.id;
            saveJSON(TICKET_FILE, ticketData);
            return existing;
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎫 AKSH'S ADVERTISING")
        .setDescription(
            "### Support Center\n\n" +
            "Welcome to the official support center for **Aksh's Advertising**.\n\n" +
            "Select the correct ticket category below and our staff team will assist you.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "🛠️ **General Support**\n" +
            "Questions, assistance and general support.\n\n" +
            "🛒 **Purchase Ticket**\n" +
            "Purchases and services.\n\n" +
            "💰 **Paid Ad Ticket**\n" +
            "Paid advertising requests.\n\n" +
            "👑 **High Rank Ticket**\n" +
            "High-rank related matters.\n\n" +
            "⭐ **SHR Ticket**\n" +
            "Senior High Rank matters.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "### 📌 Ticket Rules\n" +
            "• Select the correct category.\n" +
            "• Explain your issue clearly.\n" +
            "• Provide proof when requested.\n" +
            "• Do not spam staff.\n" +
            "• Unnecessary tickets may be closed."
        )
        .setFooter({
            text: "Aksh's Advertising • Support System"
        })
        .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("create_general")
            .setLabel("General Support")
            .setEmoji("🛠️")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("create_purchase")
            .setLabel("Purchase")
            .setEmoji("🛒")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId("create_paidad")
            .setLabel("Paid Ads")
            .setEmoji("💰")
            .setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("create_highrank")
            .setLabel("High Rank")
            .setEmoji("👑")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("create_shr")
            .setLabel("SHR")
            .setEmoji("⭐")
            .setStyle(ButtonStyle.Danger)
    );

    const message = await channel.send({
        embeds: [embed],
        components: [row1, row2]
    });

    ticketData.panelMessageId = message.id;
    saveJSON(TICKET_FILE, ticketData);

    return message;
}

// ======================================================
// CREATE TICKET
// ======================================================

async function createTicket(interaction, type) {
    const config = TICKET_CATEGORIES[type];

    if (!config) {
        return interaction.reply({
            content: "❌ Invalid ticket category.",
            flags: MessageFlags.Ephemeral
        });
    }

    const existing = Object.entries(
        ticketData.tickets
    ).find(([channelId, ticket]) =>
        ticket.guildId === interaction.guild.id &&
        ticket.userId === interaction.user.id
    );

    if (existing) {
        const channel =
            interaction.guild.channels.cache.get(
                existing[0]
            );

        if (channel) {
            return interaction.reply({
                content:
                    `❌ You already have an open ticket: ${channel}`,
                flags: MessageFlags.Ephemeral
            });
        }

        delete ticketData.tickets[existing[0]];
        saveJSON(TICKET_FILE, ticketData);
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    try {
        const overwrites = [
            {
                id: interaction.guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks
                ]
            },
            {
                id: client.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageMessages
                ]
            }
        ];

        for (const roleId of config.roles) {
            overwrites.push({
                id: roleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks
                ]
            });
        }

        const username =
            interaction.user.username
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "")
                .slice(0, 60) || "user";

        const channel =
            await interaction.guild.channels.create({
                name: `ticket-${username}`,
                type: ChannelType.GuildText,
                parent: config.categoryId,
                permissionOverwrites: overwrites
            });

        ticketData.tickets[channel.id] = {
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            type,
            claimedBy: null,
            closeRequested: false,
            locked: false,
            createdAt: Date.now()
        };

        saveJSON(TICKET_FILE, ticketData);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(
                `${config.emoji} ${config.name}`
            )
            .setDescription(
                `Welcome ${interaction.user}!\n\n` +
                "Thank you for contacting **Aksh's Advertising**.\n\n" +
                "A member of the appropriate staff team will assist you as soon as possible.\n\n" +
                "### 📋 Ticket Guidelines\n" +
                "• Explain what you need clearly.\n" +
                "• Provide proof when requested.\n" +
                "• Remain patient.\n" +
                "• Do not spam staff.\n"
            )
            .addFields(
                {
                    name: "👤 Ticket Owner",
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: "📁 Department",
                    value: config.name,
                    inline: true
                },
                {
                    name: "🟢 Status",
                    value: "Open",
                    inline: true
                }
            )
            .setFooter({
                text: "Aksh's Advertising • Ticket System"
            })
            .setTimestamp();

        await channel.send({
            content:
                `${interaction.user} ${config.roles
                    .map(id => `<@&${id}>`)
                    .join(" ")}`,
            embeds: [embed],
            components: buildTicketButtons(type, null)
        });

        await interaction.editReply({
            content:
                `✅ Your **${config.name}** has been created: ${channel}`
        });

        await sendTicketLog(
            new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle("🎫 Ticket Created")
                .addFields(
                    { name: "Ticket", value: `${channel}`, inline: true },
                    { name: "Owner", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
                    { name: "Department", value: config.name, inline: true }
                )
                .setTimestamp()
        );
    } catch (error) {
        console.error("Ticket creation failed:", error);

        await interaction.editReply({
            content:
                "❌ I could not create your ticket."
        });
    }
}

// ======================================================
// TICKET CLAIM
// ======================================================

async function claimTicket(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ This is not a registered ticket.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content: "❌ You cannot claim this ticket.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (ticket.claimedBy) {
        return interaction.reply({
            content:
                `❌ Already claimed by <@${ticket.claimedBy}>.`,
            flags: MessageFlags.Ephemeral
        });
    }

    ticket.claimedBy = interaction.user.id;
    saveJSON(TICKET_FILE, ticketData);

    await interaction.update({
        components: buildTicketButtons(
            ticket.type,
            ticket.claimedBy
        )
    });

    await interaction.channel.send(
        `🙋 **Ticket claimed by ${interaction.user}.**`
    );
    await sendTicketLog(new EmbedBuilder().setColor(0x5865F2).setTitle("🙋 Ticket Claimed").setDescription(`**Channel:** <#${interaction.channel.id}>\n**Claimed by:** ${interaction.user}`).setTimestamp());
}

// ======================================================
// TICKET UNCLAIM
// ======================================================

async function unclaimTicket(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content: "❌ You cannot unclaim this ticket.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!ticket.claimedBy) {
        return interaction.reply({
            content: "❌ This ticket is not claimed.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        ticket.claimedBy !== interaction.user.id &&
        !canEscalate(interaction.member)
    ) {
        return interaction.reply({
            content:
                "❌ Only the current claimer or SHR staff can unclaim.",
            flags: MessageFlags.Ephemeral
        });
    }

    ticket.claimedBy = null;
    saveJSON(TICKET_FILE, ticketData);

    await interaction.update({
        components: buildTicketButtons(
            ticket.type,
            null
        )
    });

    await interaction.channel.send(
        `↩️ **Ticket unclaimed by ${interaction.user}.**`
    );
    await sendTicketLog(new EmbedBuilder().setColor(0xFEE75C).setTitle("↩️ Ticket Unclaimed").setDescription(`**Channel:** <#${interaction.channel.id}>\n**Unclaimed by:** ${interaction.user}`).setTimestamp());
}

// ======================================================
// TICKET CLOSE
// ======================================================

async function closeTicket(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    const owner =
        ticket.userId === interaction.user.id;

    const staff =
        hasTicketStaffRole(
            interaction.member,
            ticket.type
        );

    if (!owner && !staff) {
        return interaction.reply({
            content:
                "❌ Only the ticket owner or staff can close this.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        content: "🔒 Closing this ticket in **5 seconds**...",
        flags: MessageFlags.Ephemeral
    });

    await interaction.channel.send(
        `🔒 Ticket closed by ${interaction.user}.`
    );
    await sendTicketLog(new EmbedBuilder().setColor(0xED4245).setTitle("🔒 Ticket Closed").setDescription(`**Channel:** #${interaction.channel.name} (\`${interaction.channel.id}\`)\n**Owner:** <@${ticket.userId}>\n**Closed by:** ${interaction.user}`).setTimestamp());

    setTimeout(async () => {
        try {
            delete ticketData.tickets[
                interaction.channel.id
            ];

            saveJSON(TICKET_FILE, ticketData);

            await interaction.channel.delete(
                "Ticket closed"
            );
        } catch (error) {
            console.error(error);
        }
    }, 5000);
}

// ======================================================
// CLOSE REQUEST
// ======================================================

async function closeRequest(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content:
                "❌ Only ticket staff can request closure.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (ticket.closeRequested) {
        return interaction.reply({
            content:
                "⚠️ A close request is already active.",
            flags: MessageFlags.Ephemeral
        });
    }

    ticket.closeRequested = true;
    saveJSON(TICKET_FILE, ticketData);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_confirm_close")
            .setLabel("Confirm Close")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId("ticket_cancel_close")
            .setLabel("Cancel")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
        content: "📝 Close request created.",
        flags: MessageFlags.Ephemeral
    });

    await interaction.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor(0xFEE75C)
                .setTitle("📝 Ticket Close Request")
                .setDescription(
                    `${interaction.user} requested that this ticket be closed.`
                )
                .setTimestamp()
        ],
        components: [row]
    });
}

async function confirmClose(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content:
                "❌ Only authorized staff can confirm closure.",
            flags: MessageFlags.Ephemeral
        });
    }

    ticket.closeRequested = false;
    saveJSON(TICKET_FILE, ticketData);

    await interaction.update({
        content:
            `🔒 Ticket closure confirmed by ${interaction.user}.`,
        components: []
    });

    setTimeout(async () => {
        try {
            delete ticketData.tickets[
                interaction.channel.id
            ];

            saveJSON(TICKET_FILE, ticketData);

            await interaction.channel.delete(
                "Ticket closed"
            );
        } catch { }
    }, 3000);
}

async function cancelClose(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content:
                "❌ Only authorized staff can cancel this.",
            flags: MessageFlags.Ephemeral
        });
    }

    ticket.closeRequested = false;
    saveJSON(TICKET_FILE, ticketData);

    await interaction.update({
        content:
            `❌ Close request cancelled by ${interaction.user}.`,
        components: []
    });
}

// ======================================================
// TICKET LOCK
// ======================================================

async function toggleTicketLock(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content:
                "❌ Only ticket staff can lock tickets.",
            flags: MessageFlags.Ephemeral
        });
    }

    const owner = interaction.guild.members.cache.get(
        ticket.userId
    );

    if (!owner) {
        return interaction.reply({
            content: "❌ Ticket owner not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    ticket.locked = !ticket.locked;

    await interaction.channel.permissionOverwrites.edit(
        owner.id,
        {
            SendMessages: !ticket.locked
        }
    );

    saveJSON(TICKET_FILE, ticketData);

    await interaction.reply({
        content:
            ticket.locked
                ? "🔐 Ticket locked."
                : "🔓 Ticket unlocked.",
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// TICKET INFO
// ======================================================

async function ticketInfo(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket information unavailable.",
            flags: MessageFlags.Ephemeral
        });
    }

    const config =
        TICKET_CATEGORIES[ticket.type];

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("ℹ️ Ticket Information")
        .addFields(
            {
                name: "👤 Owner",
                value: `<@${ticket.userId}>`,
                inline: true
            },
            {
                name: "📁 Department",
                value: config?.name || ticket.type,
                inline: true
            },
            {
                name: "🙋 Claimed By",
                value: ticket.claimedBy
                    ? `<@${ticket.claimedBy}>`
                    : "Nobody",
                inline: true
            },
            {
                name: "🔐 Locked",
                value: ticket.locked ? "Yes" : "No",
                inline: true
            },
            {
                name: "📝 Close Request",
                value: ticket.closeRequested
                    ? "Active"
                    : "None",
                inline: true
            },
            {
                name: "📅 Created",
                value:
                    `<t:${Math.floor(
                        ticket.createdAt / 1000
                    )}:R>`,
                inline: true
            }
        )
        .setTimestamp();

    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// TICKET RENAME
// ======================================================

async function renameTicket(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content:
                "❌ Only ticket staff can rename tickets.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        content:
            "✏️ Send the new channel name within **30 seconds**.",
        flags: MessageFlags.Ephemeral
    });

    const collected =
        await interaction.channel.awaitMessages({
            filter: message =>
                message.author.id === interaction.user.id,
            max: 1,
            time: 30000
        }).catch(() => null);

    const message = collected?.first();

    if (!message) return;

    const newName =
        message.content
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 90);

    if (!newName) return;

    await interaction.channel.setName(newName);

    await message.reply(
        `✅ Ticket renamed to **${newName}**.`
    );
}

// ======================================================
// TICKET ADD MEMBER
// ======================================================

async function addMember(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content:
                "❌ Only ticket staff can add members.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        content:
            "➕ Mention the member you want to add within **30 seconds**.",
        flags: MessageFlags.Ephemeral
    });

    const collected =
        await interaction.channel.awaitMessages({
            filter: message =>
                message.author.id === interaction.user.id &&
                message.mentions.users.size > 0,
            max: 1,
            time: 30000
        }).catch(() => null);

    const message = collected?.first();

    if (!message) return;

    const user = message.mentions.users.first();

    await interaction.channel.permissionOverwrites.edit(
        user.id,
        {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true,
            EmbedLinks: true
        }
    );

    await message.reply(
        `✅ Added ${user} to this ticket.`
    );
}

// ======================================================
// TICKET REMOVE MEMBER
// ======================================================

async function removeMember(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content:
                "❌ Only ticket staff can remove members.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        content:
            "➖ Mention the member you want to remove within **30 seconds**.",
        flags: MessageFlags.Ephemeral
    });

    const collected =
        await interaction.channel.awaitMessages({
            filter: message =>
                message.author.id === interaction.user.id &&
                message.mentions.users.size > 0,
            max: 1,
            time: 30000
        }).catch(() => null);

    const message = collected?.first();

    if (!message) return;

    const user = message.mentions.users.first();

    if (user.id === ticket.userId) {
        return message.reply(
            "❌ You cannot remove the ticket owner."
        );
    }

    await interaction.channel.permissionOverwrites.delete(
        user.id
    );

    await message.reply(
        `✅ Removed ${user} from this ticket.`
    );
}

// ======================================================
// TRANSCRIPT
// ======================================================

async function transcriptTicket(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        !hasTicketStaffRole(
            interaction.member,
            ticket.type
        )
    ) {
        return interaction.reply({
            content:
                "❌ Only ticket staff can create transcripts.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const messages = [];

    let lastId;

    for (let i = 0; i < 10; i++) {
        const options = {
            limit: 100
        };

        if (lastId) {
            options.before = lastId;
        }

        const batch =
            await interaction.channel.messages.fetch(
                options
            );

        if (!batch.size) break;

        messages.push(
            ...batch.map(message => ({
                author: message.author.tag,
                content: message.content,
                createdAt: message.createdAt.toISOString()
            }))
        );

        lastId = batch.last().id;

        if (batch.size < 100) break;
    }

    messages.reverse();

    const transcript =
        messages.map(message =>
            `[${message.createdAt}] ${message.author}: ${message.content}`
        ).join("\n");

    const filename =
        `transcript-${interaction.channel.id}.txt`;

    const filepath =
        path.join(DATA_DIR, filename);

    fs.writeFileSync(
        filepath,
        transcript || "No messages."
    );

    await interaction.editReply({
        content: "📄 Transcript created.",
        files: [filepath]
    });
    await sendTicketLog(
        new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("📄 Ticket Transcript")
            .setDescription(`**Ticket:** #${interaction.channel.name} (\`${interaction.channel.id}\`)\n**Requested by:** ${interaction.user}`)
            .setTimestamp(),
        [{ attachment: filepath, name: filename }]
    );

    setTimeout(() => {
        try {
            fs.unlinkSync(filepath);
        } catch { }
    }, 10000);
}

// ======================================================
// ESCALATION
// ======================================================

async function escalationMenu(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!canEscalate(interaction.member)) {
        return interaction.reply({
            content:
                "❌ Only designated SHR staff can escalate tickets.",
            flags: MessageFlags.Ephemeral
        });
    }

    const options = Object.entries(
        TICKET_CATEGORIES
    )
        .filter(([type]) => type !== ticket.type)
        .map(([type, config]) =>
            new StringSelectMenuOptionBuilder()
                .setLabel(config.name)
                .setValue(type)
                .setDescription(
                    `Transfer to ${config.name}`
                )
        );

    const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_escalate_select")
        .setPlaceholder("Select destination")
        .addOptions(options);

    await interaction.reply({
        content:
            "⬆️ Select the department to escalate this ticket to.",
        components: [
            new ActionRowBuilder().addComponents(menu)
        ],
        flags: MessageFlags.Ephemeral
    });
}

async function performEscalation(interaction) {
    const ticket = getTicket(interaction.channel.id);

    if (!ticket) {
        return interaction.reply({
            content: "❌ Ticket not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!canEscalate(interaction.member)) {
        return interaction.reply({
            content: "❌ You cannot escalate tickets.",
            flags: MessageFlags.Ephemeral
        });
    }

    const newType = interaction.values[0];
    const config = TICKET_CATEGORIES[newType];

    if (!config) {
        return interaction.reply({
            content: "❌ Invalid destination.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.channel.setParent(
        config.categoryId
    );

    for (const category of Object.values(
        TICKET_CATEGORIES
    )) {
        for (const roleId of category.roles) {
            await interaction.channel
                .permissionOverwrites
                .delete(roleId)
                .catch(() => { });
        }
    }

    for (const roleId of config.roles) {
        await interaction.channel.permissionOverwrites.edit(
            roleId,
            {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
                EmbedLinks: true
            }
        );
    }

    ticket.type = newType;
    ticket.claimedBy = null;

    saveJSON(TICKET_FILE, ticketData);

    await interaction.update({
        content:
            `⬆️ Ticket escalated to **${config.name}**.`,
        components: []
    });

    await interaction.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("⬆️ Ticket Escalated")
                .setDescription(
                    `This ticket was escalated by ${interaction.user}.`
                )
                .addFields({
                    name: "New Department",
                    value:
                        `${config.emoji} ${config.name}`
                })
                .setTimestamp()
        ],
        components: buildTicketButtons(
            newType,
            null
        )
    });
}

// ======================================================
// PARTNERSHIP
// ======================================================

async function sendPartnershipLog(
    guild,
    user,
    serverName,
    serverAd,
    serverLink,
    representatives,
    paidAdPing
) {
    const channel =
        await client.channels.fetch(
            LOG_CHANNEL_ID
        ).catch(() => null);

    if (!channel?.isTextBased()) return;

    const repText = representatives.length
        ? representatives.map(member => `${member}`).join("\n")
        : "Not provided";

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle("📋 Partnership Logged")
        .addFields(
            {
                name: "🏢 Partner Server",
                value: safeText(serverName),
                inline: true
            },
            {
                name: "📢 Server Advertisement",
                value: safeText(serverAd, 1024),
                inline: false
            },
            {
                name: "👤 Representatives",
                value: repText,
                inline: true
            },
            {
                name: "🔗 Invite",
                value: safeText(serverLink, 500),
                inline: false
            },
            {
                name: "💰 Paid Ad Ping",
                value: paidAdPing ? "Enabled" : "Disabled",
                inline: true
            },
            {
                name: "🤝 Submitted By",
                value: `${user} (\`${user.id}\`)`,
                inline: false
            }
        )
        .setFooter({
            text: `Guild: ${guild.name}`
        })
        .setTimestamp();

    await channel.send({
        embeds: [embed],
        allowedMentions: { parse: [] }
    });
}

async function createPartnership(interaction) {
    if (
        !interaction.member.roles.cache.has(
            STAFF_ROLE_ID
        )
    ) {
        return interaction.reply({
            content:
                "❌ You do not have permission to create partnerships.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });

    const serverName = safeText(
        interaction.options.getString("server_name"), 100
    );
    const serverAd = safeText(
        interaction.options.getString("server_ad"), 1024
    );
    const serverLink = safeText(
        interaction.options.getString("server_link"), 500
    );
    const representative1 =
        interaction.options.getUser("representative_1");
    const representative2 =
        interaction.options.getUser("representative_2");
    const paidAdPing =
        interaction.options.getBoolean("paid_ad_ping") ?? false;

    if (
        !/^https?:\/\/(www\.)?discord\.gg\//i.test(serverLink)
    ) {
        return interaction.editReply({
            content:
                "❌ Please provide a valid Discord invite link."
        });
    }

    const announcementChannelId = paidAdPing
        ? PAID_AD_CHANNEL_ID
        : PARTNERSHIP_CHANNEL_ID;
    const channel =
        await client.channels.fetch(
            announcementChannelId
        ).catch(() => null);

    if (!channel?.isTextBased()) {
        return interaction.editReply({
            content:
                "❌ Partnership channel not found."
        });
    }

    const representativeIds = [...new Set(
        [representative1?.id, representative2?.id].filter(Boolean)
    )];
    const representatives = [];
    const roleFailures = [];

    for (const userId of representativeIds) {
        try {
            const member = await interaction.guild.members.fetch(userId);
            representatives.push(member);

            const role = interaction.guild.roles.cache.get(
                PARTNERSHIP_REP_ROLE_ID
            );

            if (!role) {
                roleFailures.push(`${member.user.tag}: representative role not found`);
                continue;
            }

            if (
                interaction.guild.members.me.roles.highest.comparePositionTo(role) <= 0
            ) {
                roleFailures.push(`${member.user.tag}: bot role is below the representative role`);
                continue;
            }

            if (!member.roles.cache.has(PARTNERSHIP_REP_ROLE_ID)) {
                await member.roles.add(
                    PARTNERSHIP_REP_ROLE_ID,
                    "Added as a partnership representative"
                );
            }
        } catch (error) {
            console.error(`Could not assign partnership rep role to ${userId}:`, error);
            roleFailures.push(`${userId}: role assignment failed`);
        }
    }

    const representativeMentions = representatives.length
        ? representatives.map(member => `${member}`).join(", ")
        : "Not provided";

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({
            name: "Aksh's Advertising • Official Partnership",
            iconURL: client.user.displayAvatarURL()
        })
        .setTitle("🤝 NEW PARTNERSHIP")
        .setDescription(
            `## ${serverName}\n\n` +
            "We are pleased to announce a new partnership between **Aksh's Advertising** and the server above.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "### 🌐 Partner Information\n\n" +
            `**Server:** ${serverName}\n` +
            `**Representatives:** ${representativeMentions}\n\n` +
            "### 🔗 Server Invite\n\n" +
            `[**Join the Partner Server**](${serverLink})\n\n` +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "### 📢 Server Advertisement\n\n" +
            serverAd + "\n\n" +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "We appreciate the opportunity to work together and look forward to a successful partnership."
        )
        .addFields(
            {
                name: "📢 Partner",
                value: serverName,
                inline: true
            },
            {
                name: "👤 Representatives",
                value: representativeMentions,
                inline: true
            },
            {
                name: "🤝 Status",
                value: "🟢 **Active**",
                inline: true
            }
        )
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({
            text: "Aksh's Advertising • Partnership Department"
        })
        .setTimestamp();

    const announcementContent = paidAdPing
        ? `💰 **PAID PARTNERSHIP ADVERTISEMENT** <@&1557974795067457606>`
        : "🤝 **NEW PARTNERSHIP**";

    await channel.send({
        content: announcementContent,
        embeds: [embed],
        allowedMentions: {
            roles: paidAdPing ? ["1557974795067457606"] : [],
            users: [],
            parse: []
        }
    });

    await sendPartnershipLog(
        interaction.guild,
        interaction.user,
        serverName,
        serverAd,
        serverLink,
        representatives,
        paidAdPing
    );

    const failureText = roleFailures.length
        ? `\n\n⚠️ Some representative roles could not be assigned:\n${roleFailures.join("\n")}`
        : "";

    await interaction.editReply({
        content:
            `✅ **Partnership created successfully!**\n\n` +
            `**Server:** ${serverName}\n` +
            `**Representatives:** ${representativeMentions}\n` +
            `**Announcement:** <#${announcementChannelId}>` +
            failureText
    });
}

// ======================================================
// VERIFICATION PANEL
// ======================================================

async function setupVerificationPanel() {
    const channel =
        await client.channels.fetch(
            VERIFICATION_CHANNEL_ID
        ).catch(() => null);

    if (!channel?.isTextBased()) return;

    if (verificationData.panelMessageId) {
        const existing =
            await channel.messages.fetch(
                verificationData.panelMessageId
            ).catch(() => null);

        if (existing) return;
    }

    const recent = await channel.messages.fetch({
        limit: 50
    }).catch(() => null);

    const existing = recent?.find(message =>
        message.author.id === client.user.id &&
        message.embeds.some(embed =>
            embed.title === "🛡️ Server Verification"
        )
    );

    if (existing) {
        verificationData.panelMessageId =
            existing.id;

        saveJSON(
            VERIFICATION_FILE,
            verificationData
        );

        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("🛡️ Server Verification")
        .setDescription(
            "Welcome to **Aksh's Advertising**.\n\n" +
            "Click the button below to verify yourself and receive access to the server.\n\n" +
            "### Verification\n" +
            "🛡️ Click **Verify Me**\n" +
            "✅ You will receive the verified role automatically."
        )
        .setFooter({
            text: "Aksh's Advertising • Verification"
        })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("verify_member")
            .setLabel("Verify Me")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success)
    );

    const message = await channel.send({
        embeds: [embed],
        components: [row]
    });

    verificationData.panelMessageId = message.id;

    saveJSON(
        VERIFICATION_FILE,
        verificationData
    );
}

// ======================================================
// REACTION ROLES
// ======================================================

const REACTION_ROLE_CONFIG = [
    {
        emoji: "📢",
        name: "Announcement",
        roleId: "1557805059700695111"
    },
    {
        emoji: "🔔",
        name: "Sub Announcement",
        roleId: "1557974601017856020"
    },
    {
        emoji: "🎉",
        name: "Giveaway",
        roleId: "1557974710254571541"
    },
    {
        emoji: "💰",
        name: "Paid Ads",
        roleId: "1557974795067457606"
    }
];

async function setupReactionRoles() {
    if (!reactionRoles.messageId) return;

    const channel =
        await client.channels.fetch(
            REACTION_ROLE_CHANNEL_ID
        ).catch(() => null);

    if (!channel?.isTextBased()) return;

    const message =
        await channel.messages.fetch(
            reactionRoles.messageId
        ).catch(() => null);

    if (!message) return;

    for (const role of REACTION_ROLE_CONFIG) {
        await message.react(role.emoji).catch(() => { });
    }
}

async function createReactionRolePanel(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content:
                "❌ You need staff permissions.",
            flags: MessageFlags.Ephemeral
        });
    }

    const channel =
        await client.channels.fetch(
            REACTION_ROLE_CHANNEL_ID
        ).catch(() => null);

    if (!channel?.isTextBased()) {
        return interaction.reply({
            content:
                "❌ Reaction role channel not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎭 Notification Roles")
        .setDescription(
            "React below to choose the notifications you want to receive.\n\n" +
            REACTION_ROLE_CONFIG.map(
                role =>
                    `${role.emoji} **${role.name}**`
            ).join("\n\n")
        )
        .setFooter({
            text: "Aksh's Advertising • Reaction Roles"
        });

    const message = await channel.send({
        embeds: [embed]
    });

    for (const role of REACTION_ROLE_CONFIG) {
        await message.react(role.emoji);
    }

    reactionRoles.messageId = message.id;

    reactionRoles.roles = {};

    for (const role of REACTION_ROLE_CONFIG) {
        reactionRoles.roles[role.emoji] =
            role.roleId;
    }

    saveJSON(
        REACTION_FILE,
        reactionRoles
    );

    await interaction.reply({
        content:
            `✅ Reaction role panel posted in ${channel}.`,
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// INVITES
// ======================================================

async function cacheGuildInvites(guild) {
    try {
        const invites = await guild.invites.fetch();

        inviteCache.set(
            guild.id,
            new Map(
                invites.map(invite => [
                    invite.code,
                    {
                        uses: invite.uses || 0,
                        inviterId:
                            invite.inviter?.id || null
                    }
                ])
            )
        );
    } catch (error) {
        console.log(
            `⚠️ Could not cache invites for ${guild.name}.`
        );
    }
}

async function detectInvite(guild) {
    try {
        const old =
            inviteCache.get(guild.id) ||
            new Map();

        const invites =
            await guild.invites.fetch();

        let usedInvite = null;

        for (const invite of invites.values()) {
            const previous =
                old.get(invite.code);

            const oldUses =
                previous?.uses || 0;

            if ((invite.uses || 0) > oldUses) {
                usedInvite = invite;
                break;
            }
        }

        inviteCache.set(
            guild.id,
            new Map(
                invites.map(invite => [
                    invite.code,
                    {
                        uses: invite.uses || 0,
                        inviterId:
                            invite.inviter?.id || null
                    }
                ])
            )
        );

        return usedInvite;
    } catch {
        return null;
    }
}

// ======================================================
// WELCOME
// ======================================================

client.on(
    "guildMemberAdd",
    async member => {
        const inviter =
            await detectInvite(member.guild);

        const channel =
            await client.channels.fetch(
                WELCOME_CHANNEL_ID
            ).catch(() => null);

        if (channel?.isTextBased()) {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(
                    "👋 Welcome to Aksh's Advertising!"
                )
                .setDescription(
                    `Welcome ${member}!\n\n` +
                    "We're glad to have you here.\n\n" +
                    `👥 **Member Count:** ${member.guild.memberCount}\n` +
                    (
                        inviter?.inviter
                            ? `📨 **Invited By:** ${inviter.inviter}`
                            : ""
                    )
                )
                .setThumbnail(
                    member.user.displayAvatarURL({
                        size: 256
                    })
                )
                .setFooter({
                    text:
                        "Aksh's Advertising • Welcome"
                })
                .setTimestamp();

            if (
                process.env.WELCOME_BANNER_URL
            ) {
                embed.setImage(
                    process.env.WELCOME_BANNER_URL
                );
            } else if (
                member.guild.bannerURL()
            ) {
                embed.setImage(
                    member.guild.bannerURL({
                        size: 1024
                    })
                );
            }

            await channel.send({
                embeds: [embed]
            });
        }

        if (inviter?.inviter) {
            const id = inviter.inviter.id;

            if (!inviteData.users[id]) {
                inviteData.users[id] = {
                    joins: 0,
                    lastJoined: null
                };
            }

            inviteData.users[id].joins++;
            inviteData.users[id].lastJoined =
                Date.now();

            saveJSON(
                INVITE_FILE,
                inviteData
            );

            const inviteChannel =
                await client.channels.fetch(
                    INVITE_CHANNEL_ID
                ).catch(() => null);

            if (inviteChannel?.isTextBased()) {
                await inviteChannel.send(
                    `📨 ${member} joined using an invite from **${inviter.inviter.tag}**.\n` +
                    `They now have **${inviteData.users[id].joins}** tracked invite(s).`
                );
            }
        }
    }
);

// ======================================================
// VERIFICATION BUTTON
// ======================================================

async function verifyMember(interaction) {
    const member = interaction.member;

    const role =
        interaction.guild.roles.cache.get(
            VERIFICATION_ROLE_ID
        );

    if (!role) {
        return interaction.reply({
            content:
                "❌ Verification role was not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (member.roles.cache.has(role.id)) {
        return interaction.reply({
            content:
                "✅ You are already verified.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        role.position >=
        interaction.guild.members.me.roles.highest.position
    ) {
        return interaction.reply({
            content:
                "❌ I cannot manage the verification role. Move my bot role above it.",
            flags: MessageFlags.Ephemeral
        });
    }

    await member.roles.add(
        role,
        "Server verification"
    );

    await interaction.reply({
        content:
            "✅ You have been verified!",
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// INFRACTIONS
// ======================================================

function addInfraction(
    userId,
    moderatorId,
    reason,
    type
) {
    if (!infractions.users[userId]) {
        infractions.users[userId] = [];
    }

    const entry = {
        id: Date.now().toString(),
        moderatorId,
        reason,
        type,
        timestamp: Date.now()
    };

    infractions.users[userId].push(entry);

    saveJSON(
        INFRACTION_FILE,
        infractions
    );

    return entry;
}

async function logInfraction(
    target,
    moderator,
    reason,
    type
) {
    const channel =
        await client.channels.fetch(
            INFRACTION_CHANNEL_ID
        ).catch(() => null);

    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setColor(
            type === "termination"
                ? 0xED4245
                : 0xFEE75C
        )
        .setTitle("⚠️ Staff Infraction")
        .addFields(
            {
                name: "👤 User",
                value: `${target} (\`${target.id}\`)`,
                inline: false
            },
            {
                name: "🛡️ Moderator",
                value: `${moderator}`,
                inline: true
            },
            {
                name: "📌 Type",
                value: type,
                inline: true
            },
            {
                name: "📝 Reason",
                value: safeText(reason),
                inline: false
            }
        )
        .setTimestamp();

    await channel.send({
        embeds: [embed]
    });
}

// ======================================================
// PROMOTE
// ======================================================

async function promoteMember(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    const target =
        interaction.options.getMember("user");

    const role =
        interaction.options.getRole("rank");

    const reason =
        interaction.options.getString("reason");

    if (!target || !role) {
        return interaction.reply({
            content:
                "❌ User or rank not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!STAFF_ROLE_IDS.has(role.id)) {
        return interaction.reply({
            content:
                "❌ That role is not configured as a staff rank.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!canModerate(
        interaction.member,
        target
    )) {
        return interaction.reply({
            content:
                "❌ You cannot promote this member.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        role.position >=
        interaction.guild.members.me.roles.highest.position
    ) {
        return interaction.reply({
            content:
                "❌ My bot role is not high enough to assign that rank.",
            flags: MessageFlags.Ephemeral
        });
    }

    for (const id of STAFF_ROLE_IDS) {
        if (
            id !== role.id &&
            target.roles.cache.has(id)
        ) {
            await target.roles.remove(id).catch(() => { });
        }
    }

    await target.roles.add(
        role,
        `Promoted by ${interaction.user.tag}`
    );

    const channel =
        await client.channels.fetch(
            PROMOTION_CHANNEL_ID
        ).catch(() => null);

    if (channel?.isTextBased()) {
        await channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle("📈 Staff Promotion")
                    .setDescription(
                        `${target} has been promoted.`
                    )
                    .addFields(
                        {
                            name: "👤 Member",
                            value: `${target}`,
                            inline: true
                        },
                        {
                            name: "🏅 New Rank",
                            value: `${role}`,
                            inline: true
                        },
                        {
                            name: "📝 Reason",
                            value: reason,
                            inline: false
                        },
                        {
                            name: "🛡️ Promoted By",
                            value: `${interaction.user}`,
                            inline: true
                        }
                    )
                    .setTimestamp()
            ]
        });
    }

    await target.send(
        `📈 You have been promoted in **${interaction.guild.name}** to **${role.name}**.\nReason: ${reason}`
    ).catch(() => { });

    await interaction.reply({
        content:
            `✅ Promoted ${target} to **${role.name}**.`,
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// INFRACT
// ======================================================

async function infractMember(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    const target =
        interaction.options.getMember("user");

    const reason =
        interaction.options.getString("reason");

    const type =
        interaction.options.getString("type");

    if (!target) {
        return interaction.reply({
            content: "❌ Member not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!target.roles.cache.has(STAFF_ROLE_ID)) {
        return interaction.reply({
            content: "❌ Only members with the eligible staff role can receive an infraction through this command.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!canModerate(
        interaction.member,
        target
    )) {
        return interaction.reply({
            content:
                "❌ You cannot infract this member.",
            flags: MessageFlags.Ephemeral
        });
    }

    addInfraction(
        target.id,
        interaction.user.id,
        reason,
        type
    );

    if (type === "demotion") {
        const staffRoles = target.roles.cache
            .filter(role =>
                STAFF_ROLE_IDS.has(role.id)
            )
            .sort(
                (a, b) =>
                    b.position - a.position
            );

        const highest = staffRoles.first();

        if (highest) {
            await target.roles.remove(
                highest
            ).catch(() => { });
        }
    }

    if (type === "termination") {
        for (const roleId of STAFF_ROLE_IDS) {
            if (target.roles.cache.has(roleId)) {
                await target.roles.remove(
                    roleId
                ).catch(() => { });
            }
        }
    }

    await logInfraction(
        target,
        interaction.user,
        reason,
        type
    );

    await target.send(
        `⚠️ You received a **${type}** in **${interaction.guild.name}**.\nReason: ${reason}`
    ).catch(() => { });

    await interaction.reply({
        content:
            `✅ ${type} recorded for ${target}.`,
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// MODERATION
// ======================================================

async function warnMember(interaction) {
    interaction.options._hoistedOptions =
        interaction.options._hoistedOptions;

    return infractMember(interaction);
}

async function timeoutMember(interaction) {
    const target =
        interaction.options.getMember("user");

    const duration =
        interaction.options.getString("duration");

    const reason =
        interaction.options.getString("reason") ||
        "No reason provided.";

    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!target || !canModerate(
        interaction.member,
        target
    )) {
        return interaction.reply({
            content:
                "❌ You cannot timeout this member.",
            flags: MessageFlags.Ephemeral
        });
    }

    const ms = parseDuration(duration);

    if (!ms || ms > 28 * 24 * 60 * 60 * 1000) {
        return interaction.reply({
            content:
                "❌ Invalid duration. Maximum is 28d.",
            flags: MessageFlags.Ephemeral
        });
    }

    await target.timeout(
        ms,
        reason
    );

    await sendLog(
        new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle("⏱️ Member Timed Out")
            .addFields(
                {
                    name: "User",
                    value: `${target}`,
                    inline: true
                },
                {
                    name: "Duration",
                    value: formatDuration(ms),
                    inline: true
                },
                {
                    name: "Moderator",
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: "Reason",
                    value: reason
                }
            )
            .setTimestamp()
    );

    await interaction.reply({
        content:
            `⏱️ ${target} timed out for ${formatDuration(ms)}.`,
        flags: MessageFlags.Ephemeral
    });
}

async function untimeoutMember(interaction) {
    const target =
        interaction.options.getMember("user");

    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!target) {
        return interaction.reply({
            content: "❌ Member not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    await target.timeout(null);

    await interaction.reply({
        content:
            `✅ Removed timeout from ${target}.`,
        flags: MessageFlags.Ephemeral
    });
}

async function kickMember(interaction) {
    const target =
        interaction.options.getMember("user");

    const reason =
        interaction.options.getString("reason") ||
        "No reason provided.";

    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!target || !canModerate(
        interaction.member,
        target
    )) {
        return interaction.reply({
            content:
                "❌ You cannot kick this member.",
            flags: MessageFlags.Ephemeral
        });
    }

    await target.kick(reason);

    await sendLog(
        new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle("👢 Member Kicked")
            .addFields(
                {
                    name: "User",
                    value: `${target}`,
                    inline: true
                },
                {
                    name: "Moderator",
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: "Reason",
                    value: reason
                }
            )
            .setTimestamp()
    );

    await interaction.reply({
        content:
            `👢 ${target.user.tag} was kicked.`,
        flags: MessageFlags.Ephemeral
    });
}

async function banMember(interaction) {
    const target =
        interaction.options.getMember("user");

    const reason =
        interaction.options.getString("reason") ||
        "No reason provided.";

    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!target || !canModerate(
        interaction.member,
        target
    )) {
        return interaction.reply({
            content:
                "❌ You cannot ban this member.",
            flags: MessageFlags.Ephemeral
        });
    }

    await target.ban({
        reason
    });

    await sendLog(
        new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle("🔨 Member Banned")
            .addFields(
                {
                    name: "User",
                    value: `${target}`,
                    inline: true
                },
                {
                    name: "Moderator",
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: "Reason",
                    value: reason
                }
            )
            .setTimestamp()
    );

    await interaction.reply({
        content:
            `🔨 ${target.user.tag} was banned.`,
        flags: MessageFlags.Ephemeral
    });
}

async function unbanMember(interaction) {
    const userId =
        interaction.options.getString("user_id");

    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.guild.members.unban(
        userId
    );

    await interaction.reply({
        content:
            `✅ <@${userId}> has been unbanned.`,
        flags: MessageFlags.Ephemeral
    });
}

async function purgeMessages(interaction) {
    const amount =
        interaction.options.getInteger("amount");

    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (amount < 1 || amount > 100) {
        return interaction.reply({
            content:
                "❌ Amount must be between 1 and 100.",
            flags: MessageFlags.Ephemeral
        });
    }

    const deleted =
        await interaction.channel.bulkDelete(
            amount,
            true
        );

    await interaction.reply({
        content:
            `🧹 Deleted **${deleted.size}** messages.`,
        flags: MessageFlags.Ephemeral
    });
}

async function setSlowmode(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    const seconds =
        interaction.options.getInteger("seconds");

    if (seconds < 0 || seconds > 21600) {
        return interaction.reply({
            content:
                "❌ Slowmode must be 0–21600 seconds.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.channel.setRateLimitPerUser(
        seconds
    );

    await interaction.reply({
        content:
            `🐢 Slowmode set to **${seconds}s**.`,
        flags: MessageFlags.Ephemeral
    });
}

async function lockChannel(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
            SendMessages: false
        }
    );

    await interaction.reply(
        "🔒 Channel locked."
    );
}

async function unlockChannel(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
            SendMessages: null
        }
    );

    await interaction.reply(
        "🔓 Channel unlocked."
    );
}

async function changeNickname(interaction) {
    const target =
        interaction.options.getMember("user");

    const nickname =
        interaction.options.getString("nickname");

    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (!target || !canModerate(
        interaction.member,
        target
    )) {
        return interaction.reply({
            content:
                "❌ You cannot change this nickname.",
            flags: MessageFlags.Ephemeral
        });
    }

    await target.setNickname(
        nickname || null
    );

    await interaction.reply({
        content:
            `✅ Nickname updated for ${target}.`,
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// UTILITY
// ======================================================

async function showUserInfo(interaction) {
    const target =
        interaction.options.getMember("user") ||
        interaction.member;

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("👤 User Information")
        .setThumbnail(
            target.user.displayAvatarURL({
                size: 512
            })
        )
        .addFields(
            {
                name: "Username",
                value: target.user.tag,
                inline: true
            },
            {
                name: "ID",
                value: target.id,
                inline: true
            },
            {
                name: "Joined",
                value:
                    `<t:${Math.floor(
                        target.joinedTimestamp / 1000
                    )}:R>`,
                inline: true
            },
            {
                name: "Created",
                value:
                    `<t:${Math.floor(
                        target.user.createdTimestamp / 1000
                    )}:R>`,
                inline: true
            },
            {
                name: "Roles",
                value:
                    target.roles.cache
                        .filter(role =>
                            role.id !==
                            interaction.guild.id
                        )
                        .map(role => `${role}`)
                        .slice(0, 20)
                        .join(", ") || "None"
            }
        )
        .setTimestamp();

    await interaction.reply({
        embeds: [embed]
    });
}

async function showServerInfo(interaction) {
    const guild = interaction.guild;

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📊 ${guild.name}`)
        .setThumbnail(
            guild.iconURL({
                size: 512
            })
        )
        .addFields(
            {
                name: "Owner",
                value: `<@${guild.ownerId}>`,
                inline: true
            },
            {
                name: "Members",
                value: `${guild.memberCount}`,
                inline: true
            },
            {
                name: "Channels",
                value: `${guild.channels.cache.size}`,
                inline: true
            },
            {
                name: "Roles",
                value: `${guild.roles.cache.size}`,
                inline: true
            },
            {
                name: "Created",
                value:
                    `<t:${Math.floor(
                        guild.createdTimestamp / 1000
                    )}:R>`,
                inline: true
            }
        )
        .setTimestamp();

    await interaction.reply({
        embeds: [embed]
    });
}

async function showRoleInfo(interaction) {
    const role =
        interaction.options.getRole("role");

    if (!role) {
        return interaction.reply({
            content: "❌ Role not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    const embed = new EmbedBuilder()
        .setColor(role.color || 0x5865F2)
        .setTitle(`🎭 ${role.name}`)
        .addFields(
            {
                name: "ID",
                value: role.id,
                inline: true
            },
            {
                name: "Members",
                value: `${role.members.size}`,
                inline: true
            },
            {
                name: "Position",
                value: `${role.position}`,
                inline: true
            },
            {
                name: "Mentionable",
                value: role.mentionable
                    ? "Yes"
                    : "No",
                inline: true
            }
        )
        .setTimestamp();

    await interaction.reply({
        embeds: [embed]
    });
}

async function showChannelInfo(interaction) {
    const channel =
        interaction.options.getChannel("channel") ||
        interaction.channel;

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📺 ${channel.name}`)
        .addFields(
            {
                name: "ID",
                value: channel.id,
                inline: true
            },
            {
                name: "Type",
                value: channel.type.toString(),
                inline: true
            },
            {
                name: "Created",
                value:
                    `<t:${Math.floor(
                        channel.createdTimestamp / 1000
                    )}:R>`,
                inline: true
            }
        );

    await interaction.reply({
        embeds: [embed]
    });
}

async function sendRules(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("📜 Aksh's Advertising Rules")
        .setDescription(
            "Please follow these rules to keep our community professional and enjoyable."
        )
        .addFields(
            {
                name: "1. Respect",
                value:
                    "Treat members and staff respectfully."
            },
            {
                name: "2. No Harassment",
                value:
                    "Harassment, bullying or targeted abuse is not allowed."
            },
            {
                name: "3. No Spam",
                value:
                    "Do not spam messages, mentions or advertisements."
            },
            {
                name: "4. No Scams",
                value:
                    "Scams, fake giveaways and misleading offers are prohibited."
            },
            {
                name: "5. Advertising",
                value:
                    "Use the appropriate advertising systems and channels."
            },
            {
                name: "6. Staff Decisions",
                value:
                    "Follow reasonable instructions from staff."
            },
            {
                name: "7. Discord TOS",
                value:
                    "All members must follow Discord's Terms of Service."
            }
        )
        .setFooter({
            text:
                "Aksh's Advertising • Rules"
        })
        .setTimestamp();

    await interaction.reply({
        embeds: [embed]
    });
}

async function showInvites(interaction) {
    const target =
        interaction.options.getUser("user") ||
        interaction.user;

    const count =
        inviteData.users[target.id]?.joins || 0;

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("📨 Invite Statistics")
                .setDescription(
                    `${target} has **${count}** tracked invite(s).`
                )
        ]
    });
}

async function pingCommand(interaction) {
    const start = Date.now();

    await interaction.reply({
        content: "🏓 Pinging..."
    });

    const latency =
        Date.now() - start;

    await interaction.editReply(
        `🏓 Pong!\nBot latency: **${latency}ms**\nWebSocket: **${client.ws.ping}ms**`
    );
}

async function uptimeCommand(interaction) {
    await interaction.reply({
        content:
            `⏱️ Uptime: **${formatDuration(
                client.uptime
            )}**`
    });
}

async function memberCountCommand(interaction) {
    await interaction.reply({
        content:
            `👥 This server has **${interaction.guild.memberCount}** members.`
    });
}

async function avatarCommand(interaction) {
    const user =
        interaction.options.getUser("user") ||
        interaction.user;

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🖼️ ${user.username}'s Avatar`)
        .setImage(
            user.displayAvatarURL({
                size: 1024,
                extension: "png"
            })
        );

    await interaction.reply({
        embeds: [embed]
    });
}

async function serverIconCommand(interaction) {
    const icon = interaction.guild.iconURL({
        size: 1024
    });

    if (!icon) {
        return interaction.reply({
            content:
                "❌ This server has no icon.",
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(
                    `${interaction.guild.name} • Server Icon`
                )
                .setImage(icon)
        ]
    });
}

// ======================================================
// POLL
// ======================================================

async function createPoll(interaction) {
    const question =
        interaction.options.getString("question");

    const yes = "👍";
    const no = "👎";

    const message = await interaction.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("📊 Poll")
                .setDescription(
                    `**${question}**\n\n` +
                    `${yes} Yes\n` +
                    `${no} No`
                )
                .setFooter({
                    text:
                        `Poll by ${interaction.user.tag}`
                })
        ]
    });

    await message.react(yes);
    await message.react(no);

    await interaction.reply({
        content: "✅ Poll created.",
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// SAY
// ======================================================

async function sayCommand(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    const text =
        interaction.options.getString("message");

    await interaction.channel.send({
        content: text
    });

    await interaction.reply({
        content: "✅ Message sent.",
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// EMBED
// ======================================================

async function embedCommand(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    const title =
        interaction.options.getString("title");

    const description =
        interaction.options.getString("description");

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
        .setFooter({
            text:
                `Sent by ${interaction.user.tag}`
        });

    await interaction.channel.send({
        embeds: [embed]
    });

    await interaction.reply({
        content: "✅ Embed sent.",
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// QOTD
// ======================================================

async function qotdCommand(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content: "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    const question =
        interaction.options.getString("question");

    const channel =
        await client.channels.fetch(
            QOTD_CHANNEL_ID
        ).catch(() => null);

    if (!channel?.isTextBased()) {
        return interaction.reply({
            content:
                "❌ QOTD channel not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    await channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("❓ Question of the Day")
                .setDescription(
                    `## ${question}`
                )
                .setFooter({
                    text:
                        "Aksh's Advertising • QOTD"
                })
                .setTimestamp()
        ]
    });

    await interaction.reply({
        content:
            `✅ QOTD posted in ${channel}.`,
        flags: MessageFlags.Ephemeral
    });
}

// ======================================================
// GIVEAWAYS
// ======================================================

async function startGiveaway(interaction) {
    const host =
        interaction.member;

    if (
        !host.roles.cache.has(
            GIVEAWAY_HOST_ROLE_ID
        ) &&
        !isStaff(host)
    ) {
        return interaction.reply({
            content:
                "❌ You need the Giveaway Host role.",
            flags: MessageFlags.Ephemeral
        });
    }

    const durationText =
        interaction.options.getString("duration");

    const duration =
        parseDuration(durationText);

    const winners =
        interaction.options.getInteger("winners");

    const prize =
        interaction.options.getString("prize");

    const ping =
        interaction.options.getBoolean("ping") ??
        true;

    if (!duration) {
        return interaction.reply({
            content:
                "❌ Invalid duration. Examples: `10m`, `1h`, `1d`.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        winners < 1 ||
        winners > 20
    ) {
        return interaction.reply({
            content:
                "❌ Winners must be between 1 and 20.",
            flags: MessageFlags.Ephemeral
        });
    }

    const endAt =
        Date.now() + duration;

    const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("🎉 GIVEAWAY")
        .setDescription(
            `## ${prize}\n\n` +
            "Click the button below to enter!\n\n" +
            `🏆 **Winners:** ${winners}\n` +
            `⏰ **Ends:** <t:${Math.floor(
                endAt / 1000
            )}:R>\n\n` +
            "There are **no role restrictions** to enter."
        )
        .setFooter({
            text:
                `Hosted by ${interaction.user.tag}`
        })
        .setTimestamp();

    const row =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("giveaway_enter")
                .setLabel("Enter Giveaway")
                .setEmoji("🎉")
                .setStyle(ButtonStyle.Success)
        );

    const message =
        await interaction.channel.send({
            content:
                ping ? "@everyone" : undefined,
            embeds: [embed],
            components: [row]
        });

    giveaways[message.id] = {
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        messageId: message.id,
        prize,
        winners,
        hostId: interaction.user.id,
        endAt,
        ended: false,
        entries: []
    };

    saveJSON(
        GIVEAWAY_FILE,
        giveaways
    );

    await interaction.reply({
        content:
            `✅ Giveaway started. It ends <t:${Math.floor(
                endAt / 1000
            )}:R>.`,
        flags: MessageFlags.Ephemeral
    });

    setTimeout(
        () => endGiveaway(message.id),
        duration
    );
}

async function enterGiveaway(interaction) {
    const giveaway =
        giveaways[interaction.message.id];

    if (!giveaway) {
        return interaction.reply({
            content:
                "❌ Giveaway not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (giveaway.ended) {
        return interaction.reply({
            content:
                "❌ This giveaway has ended.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (
        giveaway.entries.includes(
            interaction.user.id
        )
    ) {
        return interaction.reply({
            content:
                "⚠️ You are already entered.",
            flags: MessageFlags.Ephemeral
        });
    }

    giveaway.entries.push(
        interaction.user.id
    );

    saveJSON(
        GIVEAWAY_FILE,
        giveaways
    );

    await interaction.reply({
        content:
            "🎉 You have entered the giveaway!",
        flags: MessageFlags.Ephemeral
    });
}

async function endGiveaway(messageId) {
    const giveaway = giveaways[messageId];

    if (!giveaway || giveaway.ended) return;

    giveaway.ended = true;

    saveJSON(
        GIVEAWAY_FILE,
        giveaways
    );

    const channel =
        await client.channels.fetch(
            giveaway.channelId
        ).catch(() => null);

    if (!channel?.isTextBased()) return;

    const message =
        await channel.messages.fetch(
            giveaway.messageId
        ).catch(() => null);

    if (!message) return;

    const entries =
        [...new Set(giveaway.entries)];

    const shuffled =
        entries.sort(
            () => Math.random() - 0.5
        );

    const winners =
        shuffled.slice(
            0,
            Math.min(
                giveaway.winners,
                shuffled.length
            )
        );

    const winnerText =
        winners.length
            ? winners.map(id =>
                `<@${id}>`
            ).join(", ")
            : "No valid entries.";

    const embed =
        new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle("🎉 GIVEAWAY ENDED")
            .setDescription(
                `## ${giveaway.prize}\n\n` +
                `🏆 **Winner(s):** ${winnerText}\n\n` +
                `🎟️ **Entries:** ${entries.length}`
            )
            .setTimestamp();

    await message.edit({
        embeds: [embed],
        components: []
    });
}

async function endGiveawayCommand(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content:
                "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    const messageId =
        interaction.options.getString(
            "message_id"
        );

    if (!giveaways[messageId]) {
        return interaction.reply({
            content:
                "❌ Giveaway not found.",
            flags: MessageFlags.Ephemeral
        });
    }

    await endGiveaway(messageId);

    await interaction.reply({
        content:
            "✅ Giveaway ended.",
        flags: MessageFlags.Ephemeral
    });
}

async function rerollGiveaway(interaction) {
    if (!isStaff(interaction.member)) {
        return interaction.reply({
            content:
                "❌ Staff only.",
            flags: MessageFlags.Ephemeral
        });
    }

    const messageId =
        interaction.options.getString(
            "message_id"
        );

    const giveaway =
        giveaways[messageId];

    if (!giveaway?.ended) {
        return interaction.reply({
            content:
                "❌ This giveaway has not ended.",
            flags: MessageFlags.Ephemeral
        });
    }

    const winners =
        giveaway.entries.filter(
            id => id !== null
        );

    if (!winners.length) {
        return interaction.reply({
            content:
                "❌ No entries available.",
            flags: MessageFlags.Ephemeral
        });
    }

    const winner =
        winners[
        Math.floor(
            Math.random() *
            winners.length
        )
        ];

    await interaction.reply(
        `🎉 New giveaway winner: <@${winner}>`
    );
}

// ======================================================
// AUTOMOD
// ======================================================

const BAD_WORDS = [];

const recentMessages = new Map();

client.on(
    "messageCreate",
    async message => {
        if (
            !message.guild ||
            message.author.bot
        ) return;

        const content =
            message.content.toLowerCase();

        // Ignore configured safe areas
        const safeChannels = new Set([
            PARTNERSHIP_CHANNEL_ID,
            TICKET_PANEL_CHANNEL_ID
        ]);

        // Invite detection
        if (
            !safeChannels.has(message.channel.id) &&
            /discord\.gg\/|discord\.com\/invite\//i.test(
                content
            )
        ) {
            if (!isStaff(message.member)) {
                await message.delete().catch(() => { });

                await message.channel.send({
                    content:
                        `${message.author}, Discord invites are not allowed here.`
                }).then(msg => {
                    setTimeout(
                        () => msg.delete().catch(() => { }),
                        5000
                    );
                });

                await sendLog(
                    new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle("🤖 AutoMod")
                        .setDescription(
                            `Removed a Discord invite from ${message.author}.`
                        )
                        .setTimestamp()
                );

                return;
            }
        }

        // Excessive mentions
        if (
            message.mentions.users.size +
            message.mentions.roles.size >
            5
        ) {
            if (!isStaff(message.member)) {
                await message.delete().catch(() => { });

                await sendLog(
                    new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle("🤖 AutoMod • Excessive Mentions")
                        .setDescription(
                            `${message.author} used too many mentions.`
                        )
                        .setTimestamp()
                );

                return;
            }
        }

        // Bad words
        if (
            BAD_WORDS.length &&
            BAD_WORDS.some(word =>
                content.includes(word.toLowerCase())
            )
        ) {
            if (!isStaff(message.member)) {
                await message.delete().catch(() => { });

                await sendLog(
                    new EmbedBuilder()
                        .setColor(0xED4245)
                        .setTitle("🤖 AutoMod • Word Filter")
                        .setDescription(
                            `Filtered a message from ${message.author}.`
                        )
                        .setTimestamp()
                );

                return;
            }
        }

        // Spam detection
        const now = Date.now();

        if (!recentMessages.has(message.author.id)) {
            recentMessages.set(
                message.author.id,
                []
            );
        }

        const timestamps =
            recentMessages.get(
                message.author.id
            );

        timestamps.push(now);

        while (
            timestamps.length &&
            now - timestamps[0] >
            8000
        ) {
            timestamps.shift();
        }

        if (
            timestamps.length > 6 &&
            !isStaff(message.member)
        ) {
            await message.member.timeout(
                30 * 1000,
                "AutoMod spam"
            ).catch(() => { });

            timestamps.length = 0;

            await sendLog(
                new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle("🤖 AutoMod • Spam")
                    .setDescription(
                        `${message.author} was automatically timed out for spam.`
                    )
                    .setTimestamp()
            );
        }
    }
);

// ======================================================
// APPLICATIONS
// ======================================================

const APPLICATIONS = {
    lr: {
        label: "Low Rank",
        reviewerRoles: APPLICATION_REVIEWERS.lr,
        questions: [
            ["Discord Username", "What is your Discord username?", true],
            ["Age", "Your age (optional).", false],
            ["Timezone & Availability", "Include your timezone and usual availability.", true],
            ["Weekly Hours", "How many hours can you realistically dedicate each week?", true],
            ["2FA", "Do you have Two-Factor Authentication enabled? Yes / No", true],
            ["Server History", "How long have you been here, and why did you join?", true],
            ["Prior Experience", "Describe any previous moderation experience, or write None.", true],
            ["Why Us?", "Why do you want to join this staff team? What qualities do you bring?", true],
            ["Spam Control", "A member is spamming emojis and long messages. What immediate actions would you take?", true],
            ["Handling Defiance", "A user mocks you after a polite warning. How would you respond?", true],
            ["The Friend Test", "A close friend breaks a rule. How would you handle it?", true],
            ["Escalation", "A raid begins but you cannot ban users. Explain your step-by-step response.", true],
            ["Receiving Feedback", "How do you respond to constructive criticism from senior staff?", true],
            ["Final Comments", "Anything else management should know?", false]
        ]
    },
    support: {
        label: "Support Staff",
        reviewerRoles: APPLICATION_REVIEWERS.support,
        questions: [
            ["Discord Username", "What is your Discord username?", true],
            ["Timezone & Availability", "When are you most active to help users? Include timezone.", true],
            ["Weekly Hours", "How many hours can you dedicate each week?", true],
            ["Communication", "Do you prefer public help channels, private tickets, or voice?", true],
            ["Knowledge Base", "Rate your familiarity with this server's rules, features, bots and layout from 1–10.", true],
            ["Prior Experience", "Describe previous support, customer service, or helper experience.", true],
            ["Good Support", "What makes a good support experience different from a bad one?", true],
            ["Unclear User", "A ticket only says 'It's broken, help me.' How do you respond?", true],
            ["Angry User", "A frustrated user types in caps and blames staff. How do you handle it?", true],
            ["Unknown Answer", "A user asks something you do not know. What do you do next?", true],
            ["Tech Glitch", "A command or role is not working. What basic checks do you perform?", true],
            ["Escalations & Burnout", "When do you escalate an issue, and how do you balance duties with personal time?", true]
        ]
    },
    hr: {
        label: "High Rank",
        reviewerRoles: APPLICATION_REVIEWERS.hr,
        questions: [
            ["Discord Username", "What is your Discord username?", true],
            ["Roblox Username", "Your Roblox username, if applicable.", false],
            ["Current Rank", "What is your current MR / Supervisor rank?", true],
            ["Time in Group", "How long have you been here and held your current MR position?", true],
            ["Availability", "What days and times can you oversee operations? Include timezone.", true],
            ["Role of HR", "What is the purpose of an HR, and how does it differ from an MR?", true],
            ["Training & Mentorship", "How would you mentor an LR who is struggling or lacks confidence?", true],
            ["Handling Bias", "How do you remain neutral when friends are involved?", true],
            ["Staff Slacking", "Several LRs/MRs ignore tickets and let chat become chaotic. What do you do?", true],
            ["MR Insubordination", "An MR openly disrespects you or refuses an instruction. How do you respond?", true],
            ["Borderline Ban", "A serious issue is not clearly covered by the rules. How do you decide what to do?", true],
            ["Escalation to SHR", "A backend change is needed. Write an example report to an SHR.", true],
            ["Improving Staff", "What should the staff team improve, and how would you address it?", true],
            ["Why Promote You?", "Why are you ready for HR responsibilities?", true]
        ]
    },
    shr: {
        label: "Senior High Rank",
        reviewerRoles: APPLICATION_REVIEWERS.shr,
        questions: [
            ["Discord Username", "What is your Discord username?", true],
            ["Roblox Account", "Roblox username or account link, if applicable.", false],
            ["Current HR Position", "What is your current high-rank position?", true],
            ["Time Served", "How long have you held your current HR role?", true],
            ["Weekly Commitment", "How many hours per week can you dedicate to leadership and administration?", true],
            ["Mindset of an SHR", "What is an SHR responsible for, and how does it differ from an HR?", true],
            ["Strategic Vision", "Name one major system, policy, or initiative you would introduce.", true],
            ["Maintaining Discipline", "How would you maintain standards and prevent burnout among HRs?", true],
            ["HR Abuse of Power", "You receive credible evidence that a friend who is an HR abused permissions. What are your steps?", true],
            ["Community Crisis", "The community is mass-pinging staff over an unpopular update. What do you do first?", true],
            ["Staff Conflict", "Two HRs publicly disagree and divide staff. How do you resolve it?", true],
            ["Unwritten Situation", "A critical issue is not covered by policy. How do you make an executive decision?", true],
            ["Executive Disagreement", "Ownership rejects a project you developed. How do you respond?", true],
            ["Ultimate Case", "Why should the Founders select you for an executive promotion?", true]
        ]
    }
};

function applicationPages(type) {
    const questions = APPLICATIONS[type].questions;
    const pages = [];
    for (let i = 0; i < questions.length; i += 4) pages.push(questions.slice(i, i + 4));
    return pages;
}

function buildApplicationModal(type, page, userId) {
    const config = APPLICATIONS[type];
    const pages = applicationPages(type);
    const questions = pages[page];
    const modal = new ModalBuilder()
        .setCustomId(`application_modal:${type}:${page}:${userId}`)
        .setTitle(`${config.label} Application • ${page + 1}/${pages.length}`);
    const rows = questions.map((question, index) => {
        const qIndex = page * 4 + index;
        const input = new TextInputBuilder()
            .setCustomId(`answer_${qIndex}`)
            .setLabel(question[0].slice(0, 45))
            .setPlaceholder(question[1].slice(0, 100))
            .setStyle(question[1].length > 85 ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setRequired(question[2])
            .setMaxLength(1000);
        return new ActionRowBuilder().addComponents(input);
    });
    modal.addComponents(...rows);
    return modal;
}

async function showApplicationPanel() {
    const channel = await client.channels.fetch(APPLICATION_PANEL_CHANNEL_ID).catch(() => null);
    if (!channel?.isTextBased()) return;
    const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    const existing = recent?.find(m => m.author.id === client.user.id && m.embeds.some(e => e.title === "📝 Staff Applications"));
    if (existing) return;
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("📝 Staff Applications")
        .setDescription("Select the position you wish to apply for from the menu below. Please answer every question honestly. Applications are reviewed by the designated staff team.")
        .addFields(
            { name: "🟢 Low Rank", value: "Entry-level moderation and community duties.", inline: true },
            { name: "🛟 Support Staff", value: "Assist members and handle support requests.", inline: true },
            { name: "👑 High Rank", value: "Leadership, supervision and staff management.", inline: true },
            { name: "⭐ Senior High Rank", value: "Executive leadership and server oversight.", inline: true }
        )
        .setFooter({ text: "Aksh's Advertising • Staff Applications" })
        .setTimestamp();
    const menu = new StringSelectMenuBuilder()
        .setCustomId("application_select")
        .setPlaceholder("Choose an application")
        .addOptions(
            { label: "Low Rank", value: "lr", description: "Apply for a Low Rank position", emoji: "🟢" },
            { label: "Support Staff", value: "support", description: "Apply for Support Staff", emoji: "🛟" },
            { label: "High Rank", value: "hr", description: "Apply for a High Rank position", emoji: "👑" },
            { label: "Senior High Rank", value: "shr", description: "Apply for Senior High Rank", emoji: "⭐" }
        );
    await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
}

async function handleApplicationModal(interaction) {
    const [, type, pageText, ownerId] = interaction.customId.split(":");
    if (interaction.user.id !== ownerId || !APPLICATIONS[type]) {
        return interaction.reply({ content: "This application form does not belong to you.", flags: MessageFlags.Ephemeral });
    }
    const page = Number(pageText);
    const key = `${interaction.user.id}:${type}`;
    const draft = applicationDrafts.get(key) || { answers: {} };
    const questions = applicationPages(type)[page];
    questions.forEach((question, index) => {
        const qIndex = page * 4 + index;
        draft.answers[qIndex] = interaction.fields.getTextInputValue(`answer_${qIndex}`).trim() || "Not provided";
    });
    applicationDrafts.set(key, draft);
    const pages = applicationPages(type);
    if (page + 1 < pages.length) {
        const nextPage = page + 1;
        const continueButton = new ButtonBuilder()
            .setCustomId(`application_continue:${type}:${nextPage}:${interaction.user.id}`)
            .setLabel(`Continue to page ${nextPage + 1} of ${pages.length}`)
            .setStyle(ButtonStyle.Primary);
        return interaction.reply({
            content: `✅ Page ${page + 1} saved. Click below when you're ready to continue your application.`,
            components: [new ActionRowBuilder().addComponents(continueButton)],
            flags: MessageFlags.Ephemeral
        });
    }

    const config = APPLICATIONS[type];
    const channel = await client.channels.fetch(APPLICATION_SUBMISSIONS_CHANNEL_ID).catch(() => null);
    if (!channel?.isTextBased()) {
        applicationDrafts.delete(key);
        return interaction.reply({ content: "The application submission channel could not be found. Please notify staff.", flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(`📨 ${config.label} Application`)
        .setDescription(`**Applicant:** ${interaction.user} (\`${interaction.user.id}\`)\n**Application:** ${config.label}`)
        .setFooter({ text: "Aksh's Advertising • Application Review" })
        .setTimestamp();
    config.questions.forEach((question, index) => {
        const answer = safeText(draft.answers[index] || "Not provided", 1024);
        embed.addFields({ name: question[0].slice(0, 256), value: answer || "Not provided", inline: false });
    });
    const roleMentions = config.reviewerRoles.map(id => `<@&${id}>`).join(" ");
    await channel.send({ content: `New **${config.label}** application from ${interaction.user}.\n${roleMentions}`, embeds: [embed], allowedMentions: { users: [], roles: config.reviewerRoles, parse: [] } });
    applicationDrafts.delete(key);
    return interaction.reply({ content: `✅ Your **${config.label}** application has been submitted successfully.`, flags: MessageFlags.Ephemeral });
}

// ======================================================
// TIMEZONE ROLES AND PAGINATED MENU
// ======================================================

function getTimezoneNames() {
    const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Asia/Kolkata", "Etc/UTC", "Europe/London", "America/New_York"];
    return [...new Set(["Etc/UTC", ...zones])].sort((a, b) => a.localeCompare(b));
}

function getUtcOffsetMinutes(timeZone, date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(date);
    const label = parts.find(part => part.type === "timeZoneName")?.value || "GMT";
    if (label === "GMT" || label === "GMT+00:00" || label === "GMT-00:00") return 0;
    const match = label.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;
    return (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3]));
}

function formatUtcOffset(minutes) {
    const sign = minutes >= 0 ? "+" : "-";
    const abs = Math.abs(minutes);
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

async function ensureTimezoneRoles(guild) {
    if (!guild) return;
    const offsets = new Set();
    for (const zone of getTimezoneNames()) {
        offsets.add(getUtcOffsetMinutes(zone, new Date("2026-01-15T12:00:00Z")));
        offsets.add(getUtcOffsetMinutes(zone, new Date("2026-07-15T12:00:00Z")));
    }
    for (const offset of offsets) {
        const roleName = formatUtcOffset(offset);
        let role = guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            try {
                role = await guild.roles.create({ name: roleName, mentionable: false, reason: "Timezone self-role system" });
            } catch (error) {
                console.error(`Could not create timezone role ${roleName}:`, error.message);
                continue;
            }
        }
        timezoneRoleMap[String(offset)] = role.id;
    }
    saveJSON(TIMEZONE_ROLE_FILE, timezoneRoleMap);
}

function timezoneMenuComponents(page = 0) {
    const zones = getTimezoneNames();
    const pageCount = Math.ceil(zones.length / TIMEZONE_PAGE_SIZE);
    const start = page * TIMEZONE_PAGE_SIZE;
    const visible = zones.slice(start, start + TIMEZONE_PAGE_SIZE);
    const select = new StringSelectMenuBuilder()
        .setCustomId(`timezone_select:${page}`)
        .setPlaceholder(`Select your timezone • Page ${page + 1}/${pageCount}`)
        .addOptions(visible.map(zone => ({
            label: zone.replaceAll("_", " ").slice(0, 100),
            value: zone,
            description: formatUtcOffset(getUtcOffsetMinutes(zone))
        })));
    const rows = [new ActionRowBuilder().addComponents(select)];
    const buttons = new ActionRowBuilder();
    buttons.addComponents(
        new ButtonBuilder().setCustomId(`timezone_page:${Math.max(0, page - 1)}`).setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId(`timezone_page:${Math.min(pageCount - 1, page + 1)}`).setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(page >= pageCount - 1)
    );
    rows.push(buttons);
    return rows;
}

async function showTimezonePanel() {
    const channel = await client.channels.fetch(TIMEZONE_CHANNEL_ID).catch(() => null);
    if (!channel?.isTextBased()) return;
    const recent = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    const existing = recent?.find(m => m.author.id === client.user.id && m.embeds.some(e => e.title === "🌍 Choose Your Timezone"));
    if (existing) return;
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle("🌍 Choose Your Timezone")
        .setDescription("Choose your IANA timezone from the paginated dropdown. The bot will assign the matching UTC-offset role. India is **Asia/Kolkata — UTC+05:30**.")
        .setFooter({ text: "Aksh's Advertising • Timezone Roles" });
    await channel.send({ embeds: [embed], components: timezoneMenuComponents(0) });
}

async function handleTimezoneSelect(interaction) {
    const zone = interaction.values[0];
    const offset = getUtcOffsetMinutes(zone);
    const roleId = timezoneRoleMap[String(offset)];
    if (!roleId) return interaction.reply({ content: `The role for ${formatUtcOffset(offset)} is not configured. Please notify an administrator.`, flags: MessageFlags.Ephemeral });
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) return interaction.reply({ content: "The timezone role is missing. Please notify an administrator.", flags: MessageFlags.Ephemeral });
    const oldTimezoneRoles = member.roles.cache.filter(r => /^UTC[+-]\d{2}:\d{2}$/.test(r.name));
    if (oldTimezoneRoles.size) await member.roles.remove(oldTimezoneRoles, "Timezone changed").catch(() => null);
    await member.roles.add(role, `Selected timezone ${zone}`).catch(error => { throw error; });
    return interaction.reply({ content: `✅ Your timezone is set to **${zone}** (${formatUtcOffset(offset)}). Role assigned: ${role}.`, flags: MessageFlags.Ephemeral });
}

// ======================================================
// COMMAND DEFINITIONS
// ======================================================

const commands = [];

// Partnership
commands.push(
    new SlashCommandBuilder()
        .setName("partnership")
        .setDescription("Create a partnership announcement")
        .addStringOption(option =>
            option
                .setName("server_name")
                .setDescription("Partner server name")
                .setRequired(true)
                .setMaxLength(100)
        )
        .addStringOption(option =>
            option
                .setName("server_ad")
                .setDescription("The partner server advertisement")
                .setRequired(true)
                .setMaxLength(1024)
        )
        .addStringOption(option =>
            option
                .setName("server_link")
                .setDescription("Discord invite")
                .setRequired(true)
                .setMaxLength(500)
        )
        .addUserOption(option =>
            option
                .setName("representative_1")
                .setDescription("First partnership representative")
                .setRequired(true)
        )
        // server_ad is the single advertisement field; no duplicate ad option.
        .addUserOption(option =>
            option
                .setName("representative_2")
                .setDescription("Second partnership representative (optional)")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName("paid_ad_ping")
                .setDescription("Ping the paid ads role")
                .setRequired(false)
        )
);

// Staff
commands.push(
    new SlashCommandBuilder()
        .setName("promote")
        .setDescription("Promote a staff member")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("rank")
                .setDescription("New rank")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("infract")
        .setDescription("Issue a staff infraction")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("Infraction type")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Warning",
                        value: "warning"
                    },
                    {
                        name: "Strike",
                        value: "strike"
                    },
                    {
                        name: "Demotion",
                        value: "demotion"
                    },
                    {
                        name: "Termination",
                        value: "termination"
                    }
                )
        ),

    new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a member")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason")
                .setRequired(true)
        )
);

// Moderation
commands.push(
    new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout a member")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("duration")
                .setDescription("Example: 10m, 2h, 1d")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("untimeout")
        .setDescription("Remove a timeout")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a member")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason")
        ),

    new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a member")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason")
        ),

    new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a user")
        .addStringOption(option =>
            option
                .setName("user_id")
                .setDescription("User ID")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Delete messages")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("1-100")
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Set channel slowmode")
        .addIntegerOption(option =>
            option
                .setName("seconds")
                .setDescription("0-21600")
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("lock")
        .setDescription("Lock channel"),

    new SlashCommandBuilder()
        .setName("unlock")
        .setDescription("Unlock channel"),

    new SlashCommandBuilder()
        .setName("nick")
        .setDescription("Change nickname")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Member")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("nickname")
                .setDescription("New nickname")
                .setRequired(false)
        )
);

// Utility
commands.push(
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Bot latency"),

    new SlashCommandBuilder()
        .setName("uptime")
        .setDescription("Bot uptime"),

    new SlashCommandBuilder()
        .setName("membercount")
        .setDescription("Server member count"),

    new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("User information")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Server information"),

    new SlashCommandBuilder()
        .setName("roleinfo")
        .setDescription("Role information")
        .addRoleOption(option =>
            option
                .setName("role")
                .setDescription("Role")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("channelinfo")
        .setDescription("Channel information")
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription("Channel")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Show avatar")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("servericon")
        .setDescription("Show server icon"),

    new SlashCommandBuilder()
        .setName("rules")
        .setDescription("Show server rules"),

    new SlashCommandBuilder()
        .setName("invites")
        .setDescription("Show invite statistics")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Create a poll")
        .addStringOption(option =>
            option
                .setName("question")
                .setDescription("Question")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("say")
        .setDescription("Send a message")
        .addStringOption(option =>
            option
                .setName("message")
                .setDescription("Message")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Send an embed")
        .addStringOption(option =>
            option
                .setName("title")
                .setDescription("Title")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("description")
                .setDescription("Description")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("qotd")
        .setDescription("Post question of the day")
        .addStringOption(option =>
            option
                .setName("question")
                .setDescription("Question")
                .setRequired(true)
        )
);

// Reaction roles
commands.push(
    new SlashCommandBuilder()
        .setName("reactionroles")
        .setDescription(
            "Post the reaction role panel"
        )
);

// Giveaways
commands.push(
    new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Giveaway management")
        .addSubcommand(sub =>
            sub
                .setName("start")
                .setDescription("Start a giveaway")
                .addStringOption(option =>
                    option
                        .setName("duration")
                        .setDescription(
                            "Example: 10m, 1h, 1d"
                        )
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("winners")
                        .setDescription("Number of winners")
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("prize")
                        .setDescription("Prize")
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName("ping")
                        .setDescription(
                            "Ping @everyone"
                        )
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("end")
                .setDescription("End giveaway")
                .addStringOption(option =>
                    option
                        .setName("message_id")
                        .setDescription(
                            "Giveaway message ID"
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("reroll")
                .setDescription("Reroll giveaway")
                .addStringOption(option =>
                    option
                        .setName("message_id")
                        .setDescription(
                            "Giveaway message ID"
                        )
                        .setRequired(true)
                )
        )
);

// ======================================================
// REGISTER COMMANDS
// ======================================================

async function registerCommands() {
    const rest = new REST({
        version: "10"
    }).setToken(TOKEN);

    try {
        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),
            {
                body: commands.map(
                    command =>
                        command.toJSON()
                )
            }
        );

        console.log(
            `✅ Registered ${commands.length} slash commands.`
        );
        return true;
    } catch (error) {
        console.error(
            "❌ Command registration failed:",
            error?.rawError || error
        );
        return false;
    }
}

// ======================================================
// READY
// ======================================================

client.once(
    "clientReady",
    async () => {
        console.log("");
        console.log(
            "=========================================="
        );
        console.log(
            "       AKSH'S ULTIMATE DISCORD BOT"
        );
        console.log(
            "=========================================="
        );
        console.log(
            `Logged in as ${client.user.tag}`
        );

        const commandsRegistered = await registerCommands();

        if (!commandsRegistered) {
            console.error(
                "⚠️ The bot is online, but slash commands were NOT registered. Check the error above."
            );
        }

        const guild =
            client.guilds.cache.get(
                GUILD_ID
            );

        if (guild) {
            await cacheGuildInvites(guild);
        }

        // Automatic ticket panel
        const ticketChannel =
            await client.channels.fetch(
                TICKET_PANEL_CHANNEL_ID
            ).catch(() => null);

        if (ticketChannel?.isTextBased()) {
            await sendTicketPanel(
                ticketChannel
            );
        }

        // Automatic verification panel
        await setupVerificationPanel();

        // Applications and timezone roles/panel
        await showApplicationPanel();
        await ensureTimezoneRoles(guild);
        await showTimezonePanel();

        // Existing reaction-role panel
        await setupReactionRoles();

        // Recover giveaways
        for (const giveaway of Object.values(
            giveaways
        )) {
            if (giveaway.ended) continue;

            const remaining =
                giveaway.endAt -
                Date.now();

            if (remaining <= 0) {
                await endGiveaway(
                    giveaway.messageId
                );
            } else {
                setTimeout(
                    () =>
                        endGiveaway(
                            giveaway.messageId
                        ),
                    remaining
                );
            }
        }

        console.log("");
        console.log(
            "=========================================="
        );
        console.log(
            commandsRegistered
                ? "READY — commands registered"
                : "ONLINE — slash commands need fixing"
        );
        console.log(
            "=========================================="
        );
        console.log("");
    }
);

// ======================================================
// REACTION ROLE EVENTS
// ======================================================

client.on(
    "messageReactionAdd",
    async (reaction, user) => {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch {
                return;
            }
        }

        if (
            reaction.message.id !==
            reactionRoles.messageId
        ) return;

        const roleId =
            reactionRoles.roles[
            reaction.emoji.name
            ];

        if (!roleId) return;

        const guild =
            reaction.message.guild;

        const member =
            await guild.members.fetch(
                user.id
            ).catch(() => null);

        if (!member) return;

        await member.roles.add(
            roleId,
            "Reaction role"
        ).catch(() => { });
    }
);

client.on(
    "messageReactionRemove",
    async (reaction, user) => {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch {
                return;
            }
        }

        if (
            reaction.message.id !==
            reactionRoles.messageId
        ) return;

        const roleId =
            reactionRoles.roles[
            reaction.emoji.name
            ];

        if (!roleId) return;

        const guild =
            reaction.message.guild;

        const member =
            await guild.members.fetch(
                user.id
            ).catch(() => null);

        if (!member) return;

        await member.roles.remove(
            roleId,
            "Reaction role removed"
        ).catch(() => { });
    }
);

// ======================================================
// INTERACTION HANDLER
// ======================================================

client.on(
    "interactionCreate",
    async interaction => {
        try {
            // ==================================================
            // SLASH COMMANDS
            // ==================================================

            if (
                interaction.isChatInputCommand()
            ) {
                switch (
                interaction.commandName
                ) {
                    case "partnership":
                        return createPartnership(
                            interaction
                        );

                    case "promote":
                        return promoteMember(
                            interaction
                        );

                    case "infract":
                        return infractMember(
                            interaction
                        );

                    case "warn": {
                        const target =
                            interaction.options.getMember(
                                "user"
                            );

                        const reason =
                            interaction.options.getString(
                                "reason"
                            );

                        if (!isStaff(
                            interaction.member
                        )) {
                            return interaction.reply({
                                content:
                                    "❌ Staff only.",
                                flags:
                                    MessageFlags.Ephemeral
                            });
                        }

                        if (!target ||
                            !canModerate(
                                interaction.member,
                                target
                            )
                        ) {
                            return interaction.reply({
                                content:
                                    "❌ You cannot warn this member.",
                                flags:
                                    MessageFlags.Ephemeral
                            });
                        }

                        addInfraction(
                            target.id,
                            interaction.user.id,
                            reason,
                            "warning"
                        );

                        await logInfraction(
                            target,
                            interaction.user,
                            reason,
                            "warning"
                        );

                        return interaction.reply({
                            content:
                                `⚠️ Warning issued to ${target}.`,
                            flags:
                                MessageFlags.Ephemeral
                        });
                    }

                    case "timeout":
                        return timeoutMember(
                            interaction
                        );

                    case "untimeout":
                        return untimeoutMember(
                            interaction
                        );

                    case "kick":
                        return kickMember(
                            interaction
                        );

                    case "ban":
                        return banMember(
                            interaction
                        );

                    case "unban":
                        return unbanMember(
                            interaction
                        );

                    case "purge":
                        return purgeMessages(
                            interaction
                        );

                    case "slowmode":
                        return setSlowmode(
                            interaction
                        );

                    case "lock":
                        return lockChannel(
                            interaction
                        );

                    case "unlock":
                        return unlockChannel(
                            interaction
                        );

                    case "nick":
                        return changeNickname(
                            interaction
                        );

                    case "rules":
                        return sendRules(
                            interaction
                        );

                    case "ping":
                        return pingCommand(
                            interaction
                        );

                    case "uptime":
                        return uptimeCommand(
                            interaction
                        );

                    case "membercount":
                        return memberCountCommand(
                            interaction
                        );

                    case "userinfo":
                        return showUserInfo(
                            interaction
                        );

                    case "serverinfo":
                        return showServerInfo(
                            interaction
                        );

                    case "roleinfo":
                        return showRoleInfo(
                            interaction
                        );

                    case "channelinfo":
                        return showChannelInfo(
                            interaction
                        );

                    case "avatar":
                        return avatarCommand(
                            interaction
                        );

                    case "servericon":
                        return serverIconCommand(
                            interaction
                        );

                    case "invites":
                        return showInvites(
                            interaction
                        );

                    case "poll":
                        return createPoll(
                            interaction
                        );

                    case "say":
                        return sayCommand(
                            interaction
                        );

                    case "embed":
                        return embedCommand(
                            interaction
                        );

                    case "qotd":
                        return qotdCommand(
                            interaction
                        );

                    case "reactionroles":
                        return createReactionRolePanel(
                            interaction
                        );

                    case "giveaway": {
                        const sub =
                            interaction.options.getSubcommand();

                        if (sub === "start") {
                            return startGiveaway(
                                interaction
                            );
                        }

                        if (sub === "end") {
                            return endGiveawayCommand(
                                interaction
                            );
                        }

                        if (sub === "reroll") {
                            return rerollGiveaway(
                                interaction
                            );
                        }

                        break;
                    }
                }

                return;
            }

            // ==================================================
            // APPLICATION MODALS
            // ==================================================

            if (interaction.isModalSubmit() && interaction.customId.startsWith("application_modal:")) {
                return handleApplicationModal(interaction);
            }

            // ==================================================
            // BUTTONS
            // ==================================================

            if (interaction.isButton()) {
                if (interaction.customId.startsWith("application_continue:")) {
                    const [, type, pageText, ownerId] = interaction.customId.split(":");
                    const page = Number(pageText);
                    const pages = APPLICATIONS[type] ? applicationPages(type) : [];
                    if (interaction.user.id !== ownerId || !pages[page]) {
                        return interaction.reply({
                            content: "This application continuation button does not belong to you or has expired.",
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return interaction.showModal(buildApplicationModal(type, page, interaction.user.id));
                }

                if (interaction.customId.startsWith("timezone_page:")) {
                    const page = Number(interaction.customId.split(":")[1]);
                    return interaction.update({ components: timezoneMenuComponents(page) });
                }

                const id =
                    interaction.customId;

                if (
                    id.startsWith("create_")
                ) {
                    return createTicket(
                        interaction,
                        id.replace(
                            "create_",
                            ""
                        )
                    );
                }

                if (
                    id === "verify_member"
                ) {
                    return verifyMember(
                        interaction
                    );
                }

                if (
                    id === "giveaway_enter"
                ) {
                    return enterGiveaway(
                        interaction
                    );
                }

                if (
                    id === "ticket_claim"
                ) {
                    return claimTicket(
                        interaction
                    );
                }

                if (
                    id === "ticket_unclaim"
                ) {
                    return unclaimTicket(
                        interaction
                    );
                }

                if (
                    id === "ticket_close"
                ) {
                    return closeTicket(
                        interaction
                    );
                }

                if (
                    id === "ticket_close_request"
                ) {
                    return closeRequest(
                        interaction
                    );
                }

                if (
                    id === "ticket_confirm_close"
                ) {
                    return confirmClose(
                        interaction
                    );
                }

                if (
                    id === "ticket_cancel_close"
                ) {
                    return cancelClose(
                        interaction
                    );
                }

                if (
                    id === "ticket_info"
                ) {
                    return ticketInfo(
                        interaction
                    );
                }

                if (
                    id === "ticket_rename"
                ) {
                    return renameTicket(
                        interaction
                    );
                }

                if (
                    id === "ticket_add"
                ) {
                    return addMember(
                        interaction
                    );
                }

                if (
                    id === "ticket_remove"
                ) {
                    return removeMember(
                        interaction
                    );
                }

                if (
                    id === "ticket_lock"
                ) {
                    return toggleTicketLock(
                        interaction
                    );
                }

                if (
                    id === "ticket_transcript"
                ) {
                    return transcriptTicket(
                        interaction
                    );
                }

                if (
                    id === "ticket_escalate"
                ) {
                    return escalationMenu(
                        interaction
                    );
                }
            }

            // ==================================================
            // SELECT MENUS
            // ==================================================

            if (
                interaction.isStringSelectMenu()
            ) {
                if (interaction.customId === "application_select") {
                    const type = interaction.values[0];
                    applicationDrafts.delete(`${interaction.user.id}:${type}`);
                    return interaction.showModal(buildApplicationModal(type, 0, interaction.user.id));
                }

                if (interaction.customId.startsWith("timezone_select:")) {
                    return handleTimezoneSelect(interaction);
                }

                if (
                    interaction.customId ===
                    "ticket_escalate_select"
                ) {
                    return performEscalation(
                        interaction
                    );
                }
            }
        } catch (error) {
            console.error(
                "❌ Interaction error:",
                error
            );

            if (
                interaction.isRepliable()
            ) {
                try {
                    if (
                        interaction.replied ||
                        interaction.deferred
                    ) {
                        await interaction.followUp({
                            content:
                                "❌ An unexpected error occurred.",
                            flags:
                                MessageFlags.Ephemeral
                        });
                    } else {
                        await interaction.reply({
                            content:
                                "❌ An unexpected error occurred.",
                            flags:
                                MessageFlags.Ephemeral
                        });
                    }
                } catch { }
            }
        }
    }
);

// ======================================================
// GUILD INVITE CACHE
// ======================================================

client.on(
    "inviteCreate",
    async invite => {
        if (invite.guild) {
            await cacheGuildInvites(
                invite.guild
            );
        }
    }
);

client.on(
    "inviteDelete",
    async invite => {
        if (invite.guild) {
            await cacheGuildInvites(
                invite.guild
            );
        }
    }
);

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);