import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive,
  Blocks,
  Image as ImageIcon,
  Library,
  LockKeyhole,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  Search,
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

type SidebarSection = "chats" | "archive" | "private";
type SidebarNavItem = "archive" | "private" | "library" | "plugin";
type SidebarPopup = "image" | "library" | "plugin" | null;

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
  const [openPopup, setOpenPopup] = useState<SidebarPopup>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [imageWorkspaceLoading, setImageWorkspaceLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (openPopup !== "image") {
      setImageWorkspaceLoading(false);
      return;
    }

    setImageWorkspaceLoading(true);
    const timeout = window.setTimeout(() => setImageWorkspaceLoading(false), 700);
    return () => window.clearTimeout(timeout);
  }, [openPopup]);

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
    setImageWorkspaceLoading(true);
    setOpenPopup("image");
  };

  const navItems: {
    id: SidebarNavItem;
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
      <aside
        className={cn(
          "relative z-10 hidden h-screen shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white text-slate-900 transition-[width] duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 dark:text-white md:flex",
          isCollapsed ? "w-[68px]" : "w-[272px] xl:w-[288px]",
        )}
      >
        <div className={cn("flex items-center py-4", isCollapsed ? "justify-between px-1" : "justify-between px-4")}>
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/apsaai-brand-mark.png"
              alt="ApsaAI"
              className={cn("shrink-0 object-contain", isCollapsed ? "h-7 w-7" : "h-9 w-9")}
            />
            {!isCollapsed && (
              <span className="truncate text-[21px] font-bold tracking-[-0.04em] text-slate-950 dark:text-white">
                ApsaAI
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
            )}
          >
            {isCollapsed
              ? <PanelLeftOpen className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {isCollapsed ? (
          <nav aria-label="Main navigation" className="flex flex-col items-center gap-1 px-1 pb-4 pt-1">
            <button
              type="button"
              onClick={handleNewChat}
              aria-label="New Chat"
              title="New Chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleImageNavigation}
              aria-label="Image"
              title="Image"
              aria-current={openPopup === "image" ? "page" : undefined}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                openPopup === "image"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
              )}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpenPopup("plugin")}
              aria-label="Plugin"
              title="Plugin"
              aria-current={openPopup === "plugin" ? "page" : undefined}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                openPopup === "plugin"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
              )}
            >
              <Blocks className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSection("archive");
                setIsCollapsed(false);
              }}
              aria-label="Archive"
              title="Archive"
              aria-current={section === "archive" ? "page" : undefined}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                section === "archive"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
              )}
            >
              <Archive className="h-4 w-4" />
            </button>
          </nav>
        ) : (
          <>
            <div className="px-4 pb-3">
              <Button
                onClick={handleNewChat}
                className="h-9 w-full justify-start gap-2 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white shadow-sm shadow-blue-600/15 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New Chat
                <span className="ml-auto rounded-md border border-white/25 px-1.5 py-0.5 text-[10px] font-medium text-blue-50">
                  Ctrl N
                </span>
              </Button>

              <nav aria-label="Main navigation" className="mt-2 space-y-0.5">
                <button
                  type="button"
                  onClick={handleImageNavigation}
                  aria-current={openPopup === "image" ? "page" : undefined}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                >
                  <ImageIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Image
                </button>
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      if (id === "library" || id === "plugin") {
                        setOpenPopup(id);
                      } else {
                        setSection(id);
                      }
                    }}
                    aria-current={section === id || openPopup === id ? "page" : undefined}
                    title={label}
                    className={cn(
                      "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium transition-colors",
                      section === id || openPopup === id
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4",
                      section === id || openPopup === id ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400",
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

            <div className="mx-4 border-t border-slate-200 dark:border-slate-800" />

            <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3">
              <div className="mb-2 flex items-center justify-between px-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  {section === "archive" ? "Archived chats"
                    : section === "private" ? "Private chats"
                      : "Recent"}
                </h2>
                <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  {section === "chats"
                    ? recentConversations.length + pinnedConversations.length
                    : visibleConversations.length}
                </span>
              </div>

              <label className="relative mb-2.5 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search chats"
                  aria-label="Search chats"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-900"
                />
              </label>

              <div className="flex-1 space-y-4 pr-1">
                {isLoading ? (
                  <div className="space-y-2 px-1 pt-1" aria-label="Loading chats">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-8 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />
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
                ) : visibleConversations.length > 0 ? (
                  <div className="space-y-0.5">
                    {visibleConversations.map((conversation) => renderConversation(conversation))}
                  </div>
                ) : (
                  <EmptySidebarState
                    icon={section === "archive" ? Archive : LockKeyhole}
                    title={search ? "No chats found" : section === "archive" ? "Nothing archived" : "No private chats"}
                    detail={search ? "Try another search." : section === "archive" ? "Archived chats will appear here." : "Chats moved to Private will appear here."}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </aside>

      <Dialog
        open={openPopup !== null}
        onOpenChange={(open) => {
          if (!open) setOpenPopup(null);
        }}
      >
        <DialogContent className="flex h-[min(82vh,760px)] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:w-[min(92vw,960px)]">
          {openPopup === "image" && (
            <>
              <DialogHeader className="border-b border-slate-200 px-7 py-6 pr-14 dark:border-slate-800">
                <DialogTitle className="text-xl">Image Studio</DialogTitle>
                <DialogDescription className="max-w-2xl text-sm leading-relaxed">
                  Create and organize images with ApsaAI.
                </DialogDescription>
              </DialogHeader>

              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8 text-center">
                {imageWorkspaceLoading ? (
                  <div className="w-full max-w-xl" role="status" aria-label="Preparing image workspace">
                    <div className="relative h-56 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_18px_65px_rgba(51,102,255,0.12)] dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-[0_18px_65px_rgba(51,102,255,0.12)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-white to-violet-100/70 dark:from-blue-950/50 dark:via-slate-900 dark:to-violet-950/40" />
                      <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/30 blur-3xl animate-pulse dark:bg-blue-500/20" />
                      <div className="absolute bottom-7 left-1/2 h-2.5 w-36 -translate-x-1/2 animate-pulse rounded-full bg-white/80 dark:bg-slate-700/70" />
                      <div className="absolute bottom-3 left-1/2 h-2 w-24 -translate-x-1/2 animate-pulse rounded-full bg-white/60 dark:bg-slate-800/80" />
                    </div>
                    <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Preparing your image workspace…
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-xl flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-100 text-blue-600 shadow-[0_12px_36px_rgba(51,102,255,0.14)] dark:from-blue-950/70 dark:to-violet-950/50 dark:text-blue-300">
                      <ImageIcon className="h-7 w-7" />
                    </div>
                    <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                      You haven&apos;t generated anything yet.
                    </h2>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Imagine something extraordinary and bring your idea to life. Describe what you want to create, and let ApsaAI generate it for you.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 justify-center border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                <Button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("apsa-open-image-picker"))}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Choose images or files
                </Button>
              </div>
            </>
          )}
          {openPopup === "library" && (
            <>
              <DialogHeader className="border-b border-slate-200 px-7 py-6 pr-14 dark:border-slate-800">
                <DialogTitle className="text-xl">Library</DialogTitle>
                <DialogDescription className="text-sm">
                  Find saved files and media.
                </DialogDescription>
              </DialogHeader>
              <WorkspaceEmptyState
                icon={Library}
                title="Your library is empty"
                detail="Saved files and media will appear here."
              />
            </>
          )}
          {openPopup === "plugin" && (
            <>
              <DialogHeader className="border-b border-slate-200 px-7 py-6 pr-14 dark:border-slate-800">
                <DialogTitle className="text-xl">Plugins</DialogTitle>
                <DialogDescription className="text-sm">
                  Connect tools to extend your workspace.
                </DialogDescription>
              </DialogHeader>
              <WorkspaceEmptyState
                icon={Blocks}
                title="No plugins available"
                detail="Connected plugins will appear here."
              />
            </>
          )}
        </DialogContent>
      </Dialog>

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

function WorkspaceEmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof MessageSquare;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-6 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{detail}</p>
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
          "flex h-8 min-w-0 flex-1 items-center gap-2 px-1.5 text-left text-xs",
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
