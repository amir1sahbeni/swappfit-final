const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf-8');
  for (const [search, replacement] of replacements) {
    content = content.replace(search, replacement);
  }
  fs.writeFileSync(filePath, content);
}

replaceInFile('app/purchase/[id]/purchase-view.tsx', [
  ['const t = useTranslations(\'Purchase\')', 'const t = useTranslations(\'PurchaseView\')\n  const tErr = useTranslations(\'Errors\')'],
  ['<h1 className="text-sm font-bold uppercase tracking-widest text-foreground">Purchase</h1>', '<h1 className="text-sm font-bold uppercase tracking-widest text-foreground">{t("title")}</h1>'],
  ['if (status === \'pending_seller_approval\') return \'Pending Approval\'', 'if (status === \'pending_seller_approval\') return t("statusPending")'],
  ['if (status === \'accepted\') return \'Accepted — Awaiting Receipt\'', 'if (status === \'accepted\') return t("statusAccepted")'],
  ['if (status === \'completed\') return \'Completed\'', 'if (status === \'completed\') return t("statusCompleted")'],
  ['if (status === \'cancelled\') return \'Cancelled\'', 'if (status === \'cancelled\') return t("statusCancelled")'],
  ['Item details unavailable', '{t("itemUnavailable")}'],
  ['{isSeller ? \'Buyer\' : \'Seller\'}', '{isSeller ? t("buyer") : t("seller")}'],
  ['{partner.location || \'Location not set\'}', '{partner.location || t("locationNotSet")}'],
  ['<p className="text-sm font-bold text-foreground">Total Price</p>', '<p className="text-sm font-bold text-foreground">{t("totalPrice")}</p>'],
  ['Rate your experience with {partner.name}', '{t("rateExperience", { name: partner.name })}'],
  ['<h3 className="text-lg font-bold text-foreground">Cancel this purchase?</h3>', '<h3 className="text-lg font-bold text-foreground">{t("cancelConfirmTitle")}</h3>'],
  ['The seller has already accepted. Cancelling will reopen the listing and notify them.', '{t("cancelConfirmDesc")}'],
  ['Keep It', '{t("keepIt")}'],
  ['Yes, Cancel', '{t("yesCancel")}'],
  ['Decline', '{t("decline")}'],
  ['Accept', '{t("accept")}'],
  ['Message {partner.name}', '{t("message", { name: partner.name })}'],
  ['Waiting for {partner.name} to respond…', '{t("waitingToRespond", { name: partner.name })}'],
  ['Mark as Received', '{t("markReceived")}'],
  ['<button onClick={() => setCancelConfirm(true)}\n                className="flex h-10 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive transition-transform active:scale-95">\n                Cancel\n              </button>', '<button onClick={() => setCancelConfirm(true)}\n                className="flex h-10 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-semibold text-destructive transition-transform active:scale-95">\n                {t("cancel")}\n              </button>'],
  ['<button onClick={() => setCancelConfirm(true)}\n                    className="flex h-10 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-medium text-destructive transition-transform active:scale-95">\n                    Cancel\n                  </button>', '<button onClick={() => setCancelConfirm(true)}\n                    className="flex h-10 flex-1 items-center justify-center rounded-full bg-destructive/10 text-sm font-medium text-destructive transition-transform active:scale-95">\n                    {t("cancel")}\n                  </button>'],
  ['Purchase Cancelled', '{t("purchaseCancelled")}'],
  ['Browse Items', '{t("browseItems")}'],
  ['Completed ✓', '{t("completedMark")}'],
  ['Leave a Rating', '{t("leaveRating")}'],
  ['Waiting for {partner.name} to confirm receipt…', '{t("waitingToConfirm", { name: partner.name })}'],
  ['setActionError(res.error || "Something went wrong")', 'setActionError(res.error ? tErr(res.error) : t("somethingWentWrong"))'],
  ['setActionError(res.error || "Failed to cancel.")', 'setActionError(res.error ? tErr(res.error) : t("failedToCancel"))'],
  ['setActionError(err.message || "Something went wrong")', 'setActionError(t("somethingWentWrong"))']
]);

replaceInFile('app/exchange/[id]/exchange-view.tsx', [
  ['const t = useTranslations(\'Exchange\')\n  const tv = useTranslations(\'ExchangeView\')', 'const t = useTranslations(\'Exchange\')\n  const tv = useTranslations(\'ExchangeView\')\n  const tErr = useTranslations(\'Errors\')'],
  ['<h3 className="text-lg font-bold text-foreground">Cancel this swap?</h3>', '<h3 className="text-lg font-bold text-foreground">{tv("cancelConfirmTitle")}</h3>'],
  ['The receiver has already accepted. Cancelling will revert both items to active and notify them.', '{tv("cancelConfirmDesc")}'],
  ['Keep Swap', '{tv("keepSwap")}'],
  ['Yes, Cancel', '{tv("yesCancel")}'],
  ['Cancel Swap', '{tv("cancelSwap")}'],
  ['{proposal.status === \'cancelled\' ? \'Swap Cancelled\' : \'Swap Declined\'}', '{proposal.status === \'cancelled\' ? tv("swapCancelled") : tv("swapDeclined")}'],
  ['Browse Items', '{tv("browseItems")}'],
  ['if (status === \'pending\') return \'Pending\'', 'if (status === \'pending\') return tv("statusPending")'],
  ['if (status === \'accepted\') return \'Accepted\'', 'if (status === \'accepted\') return tv("statusAccepted")'],
  ['if (status === \'declined\') return \'Declined\'', 'if (status === \'declined\') return tv("statusDeclined")'],
  ['if (status === \'cancelled\') return \'Cancelled\'', 'if (status === \'cancelled\') return tv("statusCancelled")'],
  ['setActionError(err.message || "Something went wrong")', 'setActionError(tv("somethingWentWrong"))'],
  ['setActionError(res.error || "Failed to cancel.")', 'setActionError(res.error ? tErr(res.error) : tv("failedToCancel"))']
]);

console.log('Replacements done in purchase-view.tsx and exchange-view.tsx');
