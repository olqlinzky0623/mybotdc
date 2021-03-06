import { AkairoClient, CommandHandler, ListenerHandler } from 'discord-akairo'
import { Message } from 'discord.js'
import { join } from "path";
import DataHandler from '../utils/DataHandler'
import {DEFAULT} from '../components/BotSettingEmbed'
require('dotenv').config()

declare module 'discord-akairo' {
    interface AkairoClient {
        commandHandler: CommandHandler
        listenerHandler: ListenerHandler
    }
}

interface BotOptions {
    token?:string
    owners?:string | string[]
}

export default class BotClient extends AkairoClient {
    public config!: BotOptions;
    public listenerHandler: ListenerHandler = new ListenerHandler(this, {
        directory: join(__dirname, "..", "listeners")
    })
    public commandHandler: CommandHandler = new CommandHandler(this, {
        directory: join(__dirname, "..", "commands"),
        prefix: (msg: Message):string => DataHandler.getPrefix(msg.guild?.id as string),
        allowMention: true,
        commandUtil: true,
        commandUtilLifetime: 3e5,
        defaultCooldown: 3000,
         argumentDefaults: {
            prompt: {
                modifyStart: async (_:Message):Promise<any> => {
                    _.content ="`Type \`||cancel||\` for canceling command...`"
                    return await DEFAULT(_)
                },
                modifyRetry: async (_:Message):Promise<any> => {
                    _.content ="`Type \`||cancel||\` for canceling command...`"
                    return await DEFAULT(_)
                },
                timeout: async (_:Message):Promise<any> => {
                    _.content ="No response from author, canceling the command"
                    return await DEFAULT(_)
                },
                ended: async (_:Message):Promise<any> => {
                    _.content = "The chance to try again is up"
                    return await DEFAULT(_)
                },
                cancel: async (_:Message):Promise<any> => {
                    _.content = 'Command canceled by author'
                    return await DEFAULT(_)
                },
                retries: 1,
                time: 5000,
                cancelWord: 'cancel'
            },         
            otherwise: ""
        },
        ignorePermissions: ['565906486996500510']
    })

    public constructor(config: BotOptions){
        super({
            ownerID: '565906486996500510'
        })
        this.config = config
    }

    private async _init():Promise<void>{
        this.commandHandler.useListenerHandler(this.listenerHandler)
        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            listenerHandler: this.listenerHandler,
            process
        })
        this.commandHandler.loadAll()
        this.listenerHandler.loadAll()
    }

    public async start():Promise<string>{
        await this._init()
        return this.login(this.config.token)
    }
}