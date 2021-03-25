import { constants } from "./constants.js";

export default class EventManager {
    #allUsers = new Map();
    
    constructor({ componentEmitter, socketClient }) {
        this.componentEmitter = componentEmitter
        this.socketClient = socketClient;
    }

    joinRoomAndWaitForMessage(data) {
        this.socketClient.sendMessage(constants.events.socket.JOIN_ROOM, data);

        this.componentEmitter.on(constants.events.app.MESSAGE_SENT, msg => {
            this.socketClient.sendMessage(constants.events.socket.MESSAGE, msg);
        });
    }

    updateUsers(users) {
        const connectedUsers = users;
        connectedUsers.forEach(({ id, userName }) => this.#allUsers.set(id, userName));
        this.#updateUsersComponent(this.#allUsers)
    }

    disconnectUser(user) {
        const {userName, id } = user;
        this.#allUsers.delete(id);
        this.#updateActivityLogComponent(`${userName} left!`);
        this.#updateUsersComponent(this.#allUsers);
    }

    newUserConnected(message) {
        const user = message;
        this.#allUsers.set(user.id, user.userName);
        this.#updateUsersComponent(this.#allUsers);
        this.#updateActivityLogComponent(`${user.userName} joined!`);
    }

    #emitComponentUpdate(event, message) {
        this.componentEmitter.emit(
            event,
            message
        );
    }

    #updateActivityLogComponent(message) {
        this.#emitComponentUpdate(
            constants.events.app.ACTIVITYLOG_UPDATED,
            message
        );
    }

    #updateUsersComponent(allUsers) {
        this.#emitComponentUpdate(
            constants.events.app.STATUS_UPDATED,
            Array.from(allUsers.values())
        );
    }

    getEvents() {
        const functions = Reflect.ownKeys(EventManager.prototype)
            .filter(fn => fn !== 'constructor')
            .map(name => [name, this[name].bind(this)]);
        
        return new Map(functions);
    }
}