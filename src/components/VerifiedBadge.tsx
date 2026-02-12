'use client';

interface VerifiedBadgeProps {
  type: 'identity' | 'agent' | 'property';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function VerifiedBadge({ type, size = 'md', showLabel = false }: VerifiedBadgeProps) {
  const config = {
    identity: {
      icon: '✓',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      label: 'Verified',
      tooltip: 'Identity Verified',
    },
    agent: {
      icon: '✓',
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      label: 'Verified Agent',
      tooltip: 'Licensed & Verified Agent',
    },
    property: {
      icon: '✓',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500',
      label: 'Verified Owner',
      tooltip: 'Property Ownership Verified',
    },
  };

  const { icon, color, bgColor, label, tooltip } = config[type];

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  if (showLabel) {
    return (
      <span 
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-medium ${bgColor}`}
        title={tooltip}
      >
        {icon} {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${bgColor} text-white ${sizeClasses[size]}`}
      title={tooltip}
    >
      {icon}
    </span>
  );
}

// Blue tick specifically for profiles
export function BlueTick({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <span title="Verified">
      <svg 
        className={`${sizeClasses[size]} text-blue-500`} 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
      </svg>
    </span>
  );
}

// Verified agent badge for profiles
export function VerifiedAgentBadge() {
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
      title="Licensed estate agent verified by NextPropConnect"
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      Verified Agent
    </span>
  );
}

// Verified owner badge for listings
export function VerifiedOwnerBadge() {
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
      title="Property ownership verified"
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      Verified Owner
    </span>
  );
}
