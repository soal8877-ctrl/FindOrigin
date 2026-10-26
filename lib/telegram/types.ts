export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

export type TelegramMessage = {
  message_id: number;
  chat: { id: number; type: string };
  text?: string;
  caption?: string;
};
