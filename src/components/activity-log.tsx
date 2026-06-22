import { useEffect, useState } from "react";
import { listAuditLogs } from "@/lib/api/audit.functions";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import type { AuditLog } from "@/lib/db/types";

export type { AuditLog };

export function ActivityLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await listAuditLogs({});
        setLogs(data);
      } catch {
        setLogs([]);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading activity log...
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Activity Log</h1>
      <Table className="w-full bg-white/5 backdrop-blur-sm rounded-lg border border-sidebar-border">
        <TableHeader>
          <TableRow>
            <TableCell className="font-medium">Action</TableCell>
            <TableCell className="font-medium">Timestamp</TableCell>
            <TableCell className="font-medium">User</TableCell>
            <TableCell className="font-medium">Details</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-sidebar-accent transition-colors">
              <TableCell>{log.action}</TableCell>
              <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
              <TableCell>{log.user_id}</TableCell>
              <TableCell>{log.details}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
