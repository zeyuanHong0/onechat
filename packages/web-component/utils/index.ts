// 格式化时间
export const formatTime = (date = new Date()) => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};
