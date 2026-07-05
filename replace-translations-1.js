const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf-8');
  for (const [search, replacement] of replacements) {
    content = content.replace(search, replacement);
  }
  fs.writeFileSync(filePath, content);
}

replaceInFile('app/buy/[id]/buy-view.tsx', [
  ['import { useTranslations } from "next-intl"', 'import { useTranslations } from "next-intl"'], 
  ['import { ItemCard } from "@/components/item-card"', 'import { ItemCard } from "@/components/item-card"\nimport { useTranslations } from "next-intl"'],
  ['export function BuyView({ item, seller, swapConflict = false }: { item: Item; seller: Seller; swapConflict?: boolean }) {', 'export function BuyView({ item, seller, swapConflict = false }: { item: Item; seller: Seller; swapConflict?: boolean }) {\n  const t = useTranslations("Buy")\n  const tErr = useTranslations("Errors")'],
  ['<PageHeader title="Confirm Buy" subtitle="Send a purchase request" />', '<PageHeader title={t("title")} subtitle={t("subtitle")} />'],
  ['<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Item Details</p>', '<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">{t("itemDetails")}</p>'],
  ['<span className="text-sm font-medium text-muted-foreground">Price</span>', '<span className="text-sm font-medium text-muted-foreground">{t("price")}</span>'],
  ['<span className="text-sm font-medium text-muted-foreground">Seller</span>', '<span className="text-sm font-medium text-muted-foreground">{t("seller")}</span>'],
  ['<p className="text-sm font-semibold text-destructive">You have a pending swap proposal for this item.</p>', '<p className="text-sm font-semibold text-destructive">{t("pendingSwapWarning")}</p>'],
  ['<p className="text-xs text-destructive/80 mt-0.5">Cancel your swap proposal first if you\'d rather buy it.</p>', '<p className="text-xs text-destructive/80 mt-0.5">{t("pendingSwapDesc")}</p>'],
  ['Purchase request sent! Redirecting…', '{t("requestSentRedirect")}'],
  ['Request Sent!', '{t("requestSent")}'],
  ['By confirming, a purchase request will be sent to the seller. You won\'t be charged yet. The seller must accept first.', '{t("disclaimer")}'],
  ['Confirm Buy', '{t("title")}'],
  ['Message {seller.name}', '{t("message", { name: seller.name })}'],
  ['setError(res.error || "Failed to send purchase request.")', 'setError(res.error ? tErr(res.error) : t("failedToSend"))'],
  ['setError(e.message || "Failed to send purchase request.")', 'setError(t("failedToSend"))']
]);

replaceInFile('app/swaps/swaps-list.tsx', [
  ["'This will cancel and remove this transaction. Continue?'", "t('cancelTransactionConfirm')"],
  ["'Remove this from your history?'", "t('removeHistoryConfirm')"],
  ["'Failed to delete: ' + error.message", "t('failedToDelete') + error.message"],
  ["? 'Pending'", "? t('statusPendingApproval')"],
  ["? 'Accepted'", "? t('statusAccepted')"],
  ["• Sold", "• {t('statusSold')}"]
]);

console.log('Replacements done in buy-view.tsx and swaps-list.tsx');
