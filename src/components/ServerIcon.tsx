import Image from 'next/image';
import { API_URL } from '@/services/api.service';

interface ServerIconProps {
  iconPath?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

const ServerIcon = ({
  iconPath,
  alt = 'Server Icon',
  width = 60,
  height = 60,
  className,
}: ServerIconProps) => {
  const imageUrl = iconPath
    ? iconPath.startsWith('http')
      ? iconPath
      : `${API_URL}${iconPath}`
    : '/logo_server_def.png';

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className + ' border border-gray-200 rounded'}
      unoptimized // 跳過 Next.js 的圖片優化
    />
  );
};

ServerIcon.displayName = 'ServerIcon';
export default ServerIcon;
