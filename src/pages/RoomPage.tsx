import { useParams } from "react-router";

export function RoomPage() {
  const { roomId } = useParams();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col justify-start pt-20">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-normal">房间</h1>
          <p className="text-sm text-muted-foreground">当前房间 ID：{roomId}</p>
        </div>
      </section>
    </main>
  );
}
