import { useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  Blocks,
  Image as ImageIcon,
  Library,
  LockKeyhole,
  MessageSquare,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { useConversation } from "@/contexts/conversation-context";
import type { Conversation } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type SidebarSection = "chats" | "archive" | "private" | "library" | "plugin";

export function DesktopSidebar() {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    startNewConversation,
    updateConversationMetadata,
    isLoading,
  } = useConversation();
  const { toast } = useToast();
  const [section, setSection] = useState<SidebarSection>("chats");
  const [search, setSearch] = useState("");
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const pinnedConversations = useMemo(
    () => conversations.filter((conversation) =>
      conversation.isPinned && !conversation.isPrivate && !conversation.isArchived
    ),
    [conversations],
  );
  const recentConversations = useMemo(
    () => conversations.filter((conversation) =>
      !conversation.isPinned && !conversation.isPrivate && !conversation.isArchived
    ),
    [conversations],
  );
  const visibleConversations = useMemo(() => {
    const sectionConversations = section === "archive"
      ? conversations.filter((conversation) => conversation.isArchived)
      : section === "private"
        ? conversations.filter((conversation) => conversation.isPrivate && !conversation.isArchived)
        : [];
    return sectionConversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [conversations, search, section]);
  const filteredPinned = pinnedConversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  const filteredRecent = recentConversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const notifyUpdateError = () => {
    toast({
      title: "Could not update chat",
      description: "Please try again.",
      variant: "destructive",
    });
  };

  const updateChat = async (
    conversation: Conversation,
    updates: Partial<Pick<Conversation, "title" | "isPinned" | "isPrivate" | "isArchived">>,
  ) => {
    try {
      await updateConversationMetadata(conversation.id, updates);
    } catch (error) {
      console.error("Failed to update conversation:", error);
      notifyUpdateError();
    }
  };

  const handleNewChat = async () => {
    setSection("chats");
    try {
      const id = await startNewConversation();
      if (id === null) {
        toast({
          title: "Could not start a new chat",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast({
        title: "Could not start a new chat",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const openRename = (conversation: Conversation) => {
    setRenameTarget(conversation);
    setRenameValue(conversation.title);
  };

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;

    setIsRenaming(true);
    try {
      await updateConversationMetadata(renameTarget.id, { title: renameValue.trim() });
      setRenameTarget(null);
    } catch (error) {
      console.error("Failed to rename conversation:", error);
      notifyUpdateError();
    } finally {
      setIsRenaming(false);
    }
  };

  const handleImageNavigation = () => {
    window.dispatchEvent(new CustomEvent("apsa-open-image-picker"));
  };

  const navItems: {
    id: Exclude<SidebarSection, "chats">;
    label: string;
    icon: typeof ImageIcon;
  }[] = [
    { id: "library", label: "Library", icon: Library },
    { id: "plugin", label: "Plugin", icon: Blocks },
    { id: "archive", label: "Archive", icon: Archive },
    { id: "private", label: "Private", icon: LockKeyhole },
  ];

  const renderConversation = (conversation: Conversation, isPinnedRow = false) => (
    <ConversationRow
      key={conversation.id}
      conversation={conversation}
      isActive={currentConversationId === conversation.id}
      isPinnedRow={isPinnedRow}
      onSelect={() => selectConversation(conversation.id)}
      onPin={() => updateChat(conversation, { isPinned: !conversation.isPinned })}
      onRename={() => openRename(conversation)}
      onPrivate={() => updateChat(
        conversation,
        conversation.isPrivate
          ? { isPrivate: false }
          : { isPrivate: true, isArchived: false },
      )}
      onArchive={() => updateChat(
        conversation,
        conversation.isArchived
          ? { isArchived: false }
          : { isArchived: true, isPrivate: false },
      )}
    />
  );

  return (
    <>
      <aside className="relative z-10 hidden h-screen w-[272px] shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white md:flex xl:w-[288px]">
        <div className="px-5 pb-4 pt-5">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <MessageSquare className="h-[18px] w-[18px]" />
            </div>
            <span className="text-[21px] font-bold tracking-tight">ApsaAI</span>
          </div>

          <Button
            onClick={handleNewChat}
            className="h-10 w-full justify-start gap-2.5 rounded-xl bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/15 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Chat
            <span className="ml-auto rounded-md border border-white/25 px-1.5 py-0.5 text-[10px] font-medium text-blue-50">
              Ctrl N
            </span>
          </Button>

          <nav aria-label="Main navigation" className="mt-4 space-y-1">
            <button
              type="button"
              onClick={handleImageNavigation}
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <ImageIcon className="h-[17px] w-[17px] text-slate-500 dark:text-slate-400" />
              Image
            </button>
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                aria-current={section === id ? "page" : undefined}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition-colors",
                  section === id
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                )}
              >
                <Icon className={cn(
                  "h-[17px] w-[17px]",
                  section === id ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400",
                )} />
                {label}
                {id === "archive" && conversations.some((conversation) => conversation.isArchived) && (
                  <span className="ml-auto text-[11px] text-slate-400">
                    {conversations.filter((conversation) => conversation.isArchived).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mx-5 border-t border-slate-200 dark:border-slate-800" />

        <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between px-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              {section === "archive" ? "Archived chats"
                : section === "private" ? "Private chats"
                  : section === "library" ? "Library"
                    : section === "plugin" ? "Plugins"
                      : "Recent"}
            </h2>
            {(section === "chats" || section === "archive" || section === "private") && (
              <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                {section === "chats"
                  ? recentConversations.length + pinnedConversations.length
                  : visibleConversations.length}
              </span>
            )}
          </div>

          {(section === "chats" || section === "archive" || section === "private") && (
            <label className="relative mb-3 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search chats"
                aria-label="Search chats"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-900"
              />
            </label>
          )}

          <div className="flex-1 space-y-5 pr-1">
            {isLoading && (section === "chats" || section === "archive" || section === "private") ? (
              <div className="space-y-2 px-1 pt-1" aria-label="Loading chats">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-9 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
                ))}
              </div>
            ) : section === "chats" ? (
              <>
                {filteredPinned.length > 0 && (
                  <section aria-label="Pinned chats">
                    <div className="mb-1.5 flex items-center gap-2 px-2">
                      <Pin className="h-3 w-3 text-blue-500" />
                      <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pinned Chats</h3>
                    </div>
                    <div className="space-y-0.5">
                      {filteredPinned.map((conversation) => renderConversation(conversation, true))}
                    </div>
                  </section>
                )}
                <section aria-label="Recent chats">
                  {filteredPinned.length > 0 && (
                    <h3 className="mb-1.5 px-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">Recent chats</h3>
                  )}
                  {filteredRecent.length > 0 ? (
                    <div className="space-y-0.5">
                      {filteredRecent.map((conversation) => renderConversation(conversation))}
                    </div>
                  ) : recentConversations.length === 0 && filteredPinned.length === 0 ? (
                    <EmptySidebarState
                      icon={MessageSquare}
                      title={search ? "No chats found" : "No conversations yet"}
                      detail={search ? "Try another search." : "Start a new chat to see it here."}
                    />
                  ) : search && filteredRecent.length === 0 && filteredPinned.length === 0 ? (
                    <EmptySidebarState icon={Search} title="No chats found" detail="Try another search." />
                  ) : null}
                </section>
              </>
            ) : section === "archive" || section === "private" ? (
              visibleConversations.length > 0 ? (
                <div className="space-y-0.5">
                  {visibleConversations.map((conversation) => renderConversation(conversation))}
                </div>
              ) : (
                <EmptySidebarState
                  icon={section === "archive" ? Archive : LockKeyhole}
                  title={search ? "No chats found" : section === "archive" ? "Nothing archived" : "No private chats"}
                  detail={search ? "Try another search." : section === "archive" ? "Archived chats will appear here." : "Chats moved to Private will appear here."}
                />
              )
            ) : section === "library" ? (
              <EmptySidebarState icon={Library} title="Your library is empty" detail="Saved files and media will appear here." />
            ) : (
              <EmptySidebarState icon={Blocks} title="No plugins available" detail="Connected plugins will appear here." />
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("nexus-open-settings"))}
              className="flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("nexus-open-account"))}
              className="flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              <UserRound className="h-3.5 w-3.5" />
              Account
            </button>
          </div>
        </div>
      </aside>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isRenaming) setRenameTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename chat</DialogTitle>
              <DialogDescription>Choose a name that makes this conversation easy to find.</DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={120}
              className="my-5"
              aria-label="Chat title"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTarget(null)}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!renameValue.trim() || isRenaming}>
                {isRenaming ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptySidebarState({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof MessageSquare;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center px-3 py-8 text-center">
      <Icon className="mb-2 h-5 w-5 text-slate-300 dark:text-slate-600" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 max-w-[190px] text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">{detail}</p>
    </div>
  );
}

function ConversationRow({
  conversation,
  isActive,
  isPinnedRow,
  onSelect,
  onPin,
  onRename,
  onPrivate,
  onArchive,
}: {
  conversation: Conversation;
  isActive: boolean;
  isPinnedRow: boolean;
  onSelect: () => void;
  onPin: () => void;
  onRename: () => void;
  onPrivate: () => void;
  onArchive: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-1 rounded-lg border border-transparent px-1 transition-colors",
        isActive
          ? "border-blue-100 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/50"
          : "hover:bg-slate-100 dark:hover:bg-slate-900",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-9 min-w-0 flex-1 items-center gap-2.5 px-1.5 text-left text-xs",
          isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-300",
        )}
        title={conversation.title}
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <span className="truncate">{conversation.title}</span>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPin();
        }}
        aria-label={conversation.isPinned ? `Unpin ${conversation.title}` : `Pin ${conversation.title}`}
        title={conversation.isPinned ? "Unpin chat" : "Pin chat"}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400",
          conversation.isPinned || isPinnedRow ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        {conversation.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            aria-label={`More actions for ${conversation.title}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" sideOffset={8} className="z-[140] w-48">
          <DropdownMenuItem onSelect={onRename}>Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={onPin}>
            {conversation.isPinned ? <PinOff /> : <Pin />}
            {conversation.isPinned ? "Unpin Chat" : "Pin Chat"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onPrivate}>
            <LockKeyhole />
            {conversation.isPrivate ? "Move to Recent" : "Move to Private"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onArchive}>
            <Archive />
            {conversation.isArchived ? "Restore from Archive" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
