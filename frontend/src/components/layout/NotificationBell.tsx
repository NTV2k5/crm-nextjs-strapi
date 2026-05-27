"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { strapiFetch, unwrap } from "@/lib/strapi";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const { userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userData?.id) return;

    const fetchNotifications = async () => {
      try {
        const res = await strapiFetch(`/reminders?filters[assignedTo][id][$eq]=${userData.id}&filters[status][$eq]=pending`);
        const data = unwrap<any[]>(res);
        setCount(data.length || 0);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [userData?.id]);

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="rounded-xl h-10 w-10 bg-background shadow-sm border-border relative flex"
      onClick={() => router.push("/")}
    >
      <Bell className="h-4 w-4 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-background shadow-sm">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  );
}
