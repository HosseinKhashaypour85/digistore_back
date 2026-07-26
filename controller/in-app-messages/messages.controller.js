const Messages = require('../../model/in-app-msgs');

const createAppMessage = async (req, res) => {
    try {
        const { title, desc } = req.body;

        if (!title || !desc) {
            return res.status(400).json({
                success: false,
                message: "title and desc are required"
            });
        }

        const message = await Messages.create({
            title,
            desc
        });

        return res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error creating message",
            error: error.message
        });
    }
}

const updateAppMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, desc } = req.body;

        const message = await Messages.findByPk(id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        await message.update({
            title: title || message.title,
            desc: desc || message.desc
        });

        return res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating message",
            error: error.message
        });
    }
}

const deleteAppMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await Messages.findByPk(id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        await message.destroy();

        return res.status(200).json({
            success: true,
            message: "Message deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting message",
            error: error.message
        });
    }
}

const getAllAppMessages = async (req, res) => {
    try {
        const messages = await Messages.findAll();
        return res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching messages",
            error: error.message
        });
    }
}

module.exports = { createAppMessage, updateAppMessage, deleteAppMessage, getAllAppMessages }
