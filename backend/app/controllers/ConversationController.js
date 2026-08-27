import ConversationService from '../services/ConversationService.js';

class ConversationController {

	static async save(req, res) {
		try {
			console.log('req.body', req.body);
			const record = await ConversationService.save(
				req.body
			);
			console.log(record)
			res.json({
				success: true,
				record
			});
		} catch (error) {
			console.error(
				'[controller] Lỗi lưu conversation:',
				error
			);

			res.status(
				error.statusCode || 500
			).json({
				error: error.message
			});
		}
	}

	static async index(req, res) {
		try {
			const conversations =
				await ConversationService.findAll();

			res.json(conversations);
		} catch (error) {
			console.error(
				'[controller] Lỗi lấy conversations:',
				error
			);

			res.status(500).json({
				error: error.message
			});
		}
	}

	static async show(req, res) {
		try {
			const conversation =
				await ConversationService.findByRequestId(
					req.params.requestId
				);

			if (!conversation) {
				return res.status(404).json({
					error: 'Không tìm thấy'
				});
			}

			res.json(conversation);
		} catch (error) {
			console.error(
				'[controller] Lỗi lấy conversation:',
				error
			);

			res.status(500).json({
				error: error.message
			});
		}
	}
	static async chat(req, res) {
		try {
			console.log('resquest', req.body);
			let message = req.body.message || [];
			// const conversation =
			// 	await ConversationService.findByRequestId(
			// 		req.params.requestId
			// 	);

			// if (!conversation) {
			// 	return res.status(404).json({
			// 		error: 'Không tìm thấy'
			// 	});
			// }
			const conversation = `Hello! Đây là phản hồi từ server.${message}`;
			res.json(conversation);
		} catch (error) {
			console.error(
				'[controller] Lỗi lấy conversation:',
				error
			);

			res.status(500).json({
				error: error.message
			});
		}
	}
}

export default ConversationController;