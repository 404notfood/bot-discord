/**
 * @fileoverview Gestionnaire d'événements pour suivre les actions sur le serveur
 */

import { Events, EmbedBuilder, AuditLogEvent } from 'discord.js';
import * as config from '../config.js';
import * as Logger from '../utils/logger.js';

/**
 * Classe pour gérer les événements du serveur
 */
class GuildEventsHandler {
    /**
     * Initialise le gestionnaire d'événements
     */
    constructor() {
        this.events = [
            {
                name: Events.GuildMemberAdd,
                execute: this.handleGuildMemberAdd.bind(this)
            },
            {
                name: Events.GuildMemberRemove,
                execute: this.handleGuildMemberRemove.bind(this)
            },
            {
                name: Events.GuildBanAdd,
                execute: this.handleGuildBanAdd.bind(this)
            },
            {
                name: Events.GuildBanRemove,
                execute: this.handleGuildBanRemove.bind(this)
            }
        ];
    }

    /**
     * Obtient le canal de logs server
     * @param {Client} client - Le client Discord
     * @returns {TextChannel|null} - Le canal de logs ou null si non trouvé
     */
    getServerLogChannel(client) {
        try {
            return client.channels.cache.get(config.logChannelId);
        } catch (error) {
            Logger.error('Erreur lors de la récupération du canal de logs serveur', { error });
            return null;
        }
    }

    /**
     * Crée un embed pour les événements de serveur
     * @param {string} title - Titre de l'embed
     * @param {string} description - Description de l'embed
     * @param {string} color - Couleur de l'embed en hexadécimal
     * @returns {EmbedBuilder} - L'embed créé
     */
    createServerLogEmbed(title, description, color) {
        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();
    }

    /**
     * Gère l'événement d'arrivée d'un membre
     * @param {GuildMember} member - Le membre qui a rejoint
     */
    async handleGuildMemberAdd(member) {
        const logChannel = this.getServerLogChannel(member.client);
        if (!logChannel) return;

        const joinEmbed = this.createServerLogEmbed(
            '👋 Nouveau Membre',
            `**${member.user.tag}** (${member.id}) a rejoint le serveur.`,
            '#43B581' // Vert
        )
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
            { name: 'Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Nombre de membres', value: `${member.guild.memberCount}`, inline: true }
        );

        await logChannel.send({ embeds: [joinEmbed] });
    }

    /**
     * Gère l'événement de départ d'un membre
     * @param {GuildMember} member - Le membre qui est parti
     */
    async handleGuildMemberRemove(member) {
        const logChannel = this.getServerLogChannel(member.client);
        if (!logChannel) return;

        // Vérifier si le membre a été expulsé
        const fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberKick,
        });
        
        const kickLog = fetchedLogs.entries.first();
        
        // Si l'audit log est récent (moins de 5 secondes) et concerne ce membre, c'est un kick
        const isKick = kickLog && 
            kickLog.target.id === member.id && 
            (kickLog.createdTimestamp > (Date.now() - 5000));

        if (isKick) {
            // Le membre a été expulsé, traité par handleKick
            await this.handleKick(member, kickLog);
        } else {
            // Le membre est parti de lui-même
            const leaveEmbed = this.createServerLogEmbed(
                '👋 Membre Parti',
                `**${member.user.tag}** (${member.id}) a quitté le serveur.`,
                '#F04747' // Rouge
            )
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: 'A rejoint le', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Inconnu', inline: true },
                { name: 'Nombre de membres', value: `${member.guild.memberCount}`, inline: true }
            );

            await logChannel.send({ embeds: [leaveEmbed] });
        }
    }

    /**
     * Gère l'événement d'un membre expulsé
     * @param {GuildMember} member - Le membre expulsé
     * @param {GuildAuditLogsEntry} kickLog - L'entrée du log d'audit
     */
    async handleKick(member, kickLog) {
        const logChannel = this.getServerLogChannel(member.client);
        if (!logChannel) return;

        const executor = kickLog.executor || { tag: 'Inconnu', id: 'Inconnu' };
        const reason = kickLog.reason || 'Aucune raison fournie';

        const kickEmbed = this.createServerLogEmbed(
            '👢 Membre Expulsé',
            `**${member.user.tag}** (${member.id}) a été expulsé du serveur.`,
            '#FF7700' // Orange
        )
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
            { name: 'Expulsé par', value: `${executor.tag} (${executor.id})`, inline: true },
            { name: 'Raison', value: reason, inline: true },
            { name: 'Nombre de membres', value: `${member.guild.memberCount}`, inline: true }
        );

        await logChannel.send({ embeds: [kickEmbed] });
    }

    /**
     * Gère l'événement d'un membre banni
     * @param {GuildBan} ban - L'objet ban
     */
    async handleGuildBanAdd(ban) {
        const logChannel = this.getServerLogChannel(ban.client);
        if (!logChannel) return;

        const { guild, user } = ban;
        
        // Récupérer les logs d'audit pour obtenir qui a banni et pourquoi
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanAdd,
        });
        
        const banLog = fetchedLogs.entries.first();
        const executor = banLog?.executor || { tag: 'Inconnu', id: 'Inconnu' };
        const reason = banLog?.reason || 'Aucune raison fournie';

        const banEmbed = this.createServerLogEmbed(
            '🔨 Membre Banni',
            `**${user.tag}** (${user.id}) a été banni du serveur.`,
            '#992D22' // Rouge foncé
        )
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: 'Banni par', value: `${executor.tag} (${executor.id})`, inline: true },
            { name: 'Raison', value: reason, inline: true },
            { name: 'Nombre de membres', value: `${guild.memberCount}`, inline: true }
        );

        await logChannel.send({ embeds: [banEmbed] });
    }

    /**
     * Gère l'événement de débannissement d'un membre
     * @param {GuildBan} ban - L'objet ban
     */
    async handleGuildBanRemove(ban) {
        const logChannel = this.getServerLogChannel(ban.client);
        if (!logChannel) return;

        const { guild, user } = ban;
        
        // Récupérer les logs d'audit pour obtenir qui a débanni
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanRemove,
        });
        
        const banLog = fetchedLogs.entries.first();
        const executor = banLog?.executor || { tag: 'Inconnu', id: 'Inconnu' };

        const unbanEmbed = this.createServerLogEmbed(
            '🔓 Membre Débanni',
            `**${user.tag}** (${user.id}) a été débanni du serveur.`,
            '#3498DB' // Bleu
        )
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: 'Débanni par', value: `${executor.tag} (${executor.id})`, inline: true },
            { name: 'Nombre de membres', value: `${guild.memberCount}`, inline: true }
        );

        await logChannel.send({ embeds: [unbanEmbed] });
    }

    /**
     * Enregistre tous les événements auprès du client
     * @param {Client} client - Le client Discord
     */
    registerEvents(client) {
        for (const event of this.events) {
            client.on(event.name, event.execute);
        }
        Logger.info('Événements de serveur enregistrés', { events: this.events.map(e => e.name) });
    }
}

// Exporter une instance de la classe pour l'utiliser ailleurs
const guildEvents = new GuildEventsHandler();
export default guildEvents; 