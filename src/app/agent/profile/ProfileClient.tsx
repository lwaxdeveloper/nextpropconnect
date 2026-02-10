"use client";

import { useRouter } from "next/navigation";
import ProfileForm from "@/components/agent/ProfileForm";

interface ProfileData {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  profile: {
    bio?: string;
    areas_served?: string[];
    specializations?: string[];
    commission_rate?: number;
    eaab_number?: string;
    ffc_number?: string;
    show_phone?: boolean;
    enable_whatsapp?: boolean;
    agency_name?: string;
  } | null;
}

export default function ProfileClient({ data }: { data: ProfileData }) {
  const router = useRouter();

  return (
    <ProfileForm
      data={data}
      onSave={() => router.refresh()}
    />
  );
}
