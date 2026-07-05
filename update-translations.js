const fs = require('fs');

const enFile = 'messages/en.json';
const frFile = 'messages/fr.json';
const arFile = 'messages/ar.json';

const en = JSON.parse(fs.readFileSync(enFile));
const fr = JSON.parse(fs.readFileSync(frFile));
const ar = JSON.parse(fs.readFileSync(arFile));

const newEn = {
  PurchaseView: {
    title: "Purchase",
    statusPending: "Pending Approval",
    statusAccepted: "Accepted — Awaiting Receipt",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    itemUnavailable: "Item details unavailable",
    buyer: "Buyer",
    seller: "Seller",
    locationNotSet: "Location not set",
    totalPrice: "Total Price",
    rateExperience: "Rate your experience with {name}",
    cancelConfirmTitle: "Cancel this purchase?",
    cancelConfirmDesc: "The seller has already accepted. Cancelling will reopen the listing and notify them.",
    keepIt: "Keep It",
    yesCancel: "Yes, Cancel",
    decline: "Decline",
    accept: "Accept",
    message: "Message",
    waitingToRespond: "Waiting for {name} to respond…",
    markReceived: "Mark as Received",
    cancel: "Cancel",
    purchaseCancelled: "Purchase Cancelled",
    browseItems: "Browse Items",
    completedMark: "Completed ✓",
    leaveRating: "Leave a Rating",
    waitingToConfirm: "Waiting for {name} to confirm receipt…",
    somethingWentWrong: "Something went wrong",
    failedToCancel: "Failed to cancel."
  },
  Buy: {
    title: "Confirm Buy",
    subtitle: "Send a purchase request",
    itemDetails: "Item Details",
    price: "Price",
    seller: "Seller",
    pendingSwapWarning: "You have a pending swap proposal for this item.",
    pendingSwapDesc: "Cancel your swap proposal first if you'd rather buy it.",
    requestSent: "Request Sent!",
    requestSentRedirect: "Purchase request sent! Redirecting…",
    disclaimer: "By confirming, a purchase request will be sent to the seller. You won't be charged yet. The seller must accept first.",
    failedToSend: "Failed to send purchase request.",
    message: "Message {name}"
  }
};

const newFr = {
  PurchaseView: {
    title: "Achat",
    statusPending: "En attente d'approbation",
    statusAccepted: "Accepté — En attente de réception",
    statusCompleted: "Terminé",
    statusCancelled: "Annulé",
    itemUnavailable: "Détails de l'article indisponibles",
    buyer: "Acheteur",
    seller: "Vendeur",
    locationNotSet: "Lieu non défini",
    totalPrice: "Prix total",
    rateExperience: "Évaluez votre expérience avec {name}",
    cancelConfirmTitle: "Annuler cet achat ?",
    cancelConfirmDesc: "Le vendeur a déjà accepté. L'annulation rouvrira l'annonce et l'informera.",
    keepIt: "Garder",
    yesCancel: "Oui, annuler",
    decline: "Refuser",
    accept: "Accepter",
    message: "Message",
    waitingToRespond: "En attente de la réponse de {name}…",
    markReceived: "Marquer comme reçu",
    cancel: "Annuler",
    purchaseCancelled: "Achat annulé",
    browseItems: "Parcourir les articles",
    completedMark: "Terminé ✓",
    leaveRating: "Laisser une évaluation",
    waitingToConfirm: "En attente que {name} confirme la réception…",
    somethingWentWrong: "Une erreur est survenue",
    failedToCancel: "Échec de l'annulation."
  },
  Buy: {
    title: "Confirmer l'achat",
    subtitle: "Envoyer une demande d'achat",
    itemDetails: "Détails de l'article",
    price: "Prix",
    seller: "Vendeur",
    pendingSwapWarning: "Vous avez une proposition de troc en attente pour cet article.",
    pendingSwapDesc: "Annulez d'abord votre proposition de troc si vous préférez l'acheter.",
    requestSent: "Demande envoyée !",
    requestSentRedirect: "Demande d'achat envoyée ! Redirection…",
    disclaimer: "En confirmant, une demande d'achat sera envoyée au vendeur. Vous ne serez pas encore débité. Le vendeur doit d'abord accepter.",
    failedToSend: "Échec de l'envoi de la demande d'achat.",
    message: "Message {name}"
  }
};

const newAr = {
  PurchaseView: {
    title: "شراء",
    statusPending: "في انتظار الموافقة",
    statusAccepted: "مقبول — في انتظار الاستلام",
    statusCompleted: "مكتمل",
    statusCancelled: "ملغى",
    itemUnavailable: "تفاصيل العنصر غير متوفرة",
    buyer: "المشتري",
    seller: "البائع",
    locationNotSet: "لم يتم تحديد الموقع",
    totalPrice: "السعر الإجمالي",
    rateExperience: "قيم تجربتك مع {name}",
    cancelConfirmTitle: "هل تريد إلغاء هذا الشراء؟",
    cancelConfirmDesc: "لقد وافق البائع بالفعل. سيؤدي الإلغاء إلى إعادة فتح القائمة وإبلاغه.",
    keepIt: "احتفظ به",
    yesCancel: "نعم، ألغِ",
    decline: "رفض",
    accept: "قبول",
    message: "رسالة",
    waitingToRespond: "في انتظار رد {name}…",
    markReceived: "تحديد كتم الاستلام",
    cancel: "إلغاء",
    purchaseCancelled: "تم إلغاء الشراء",
    browseItems: "تصفح العناصر",
    completedMark: "مكتمل ✓",
    leaveRating: "اترك تقييمًا",
    waitingToConfirm: "في انتظار تأكيد {name} الاستلام…",
    somethingWentWrong: "حدث خطأ ما",
    failedToCancel: "فشل الإلغاء."
  },
  Buy: {
    title: "تأكيد الشراء",
    subtitle: "إرسال طلب شراء",
    itemDetails: "تفاصيل العنصر",
    price: "السعر",
    seller: "البائع",
    pendingSwapWarning: "لديك اقتراح تبادل معلق لهذا العنصر.",
    pendingSwapDesc: "قم بإلغاء اقتراح التبادل أولاً إذا كنت تفضل شراءه.",
    requestSent: "تم إرسال الطلب!",
    requestSentRedirect: "تم إرسال طلب الشراء! جاري التوجيه…",
    disclaimer: "من خلال التأكيد، سيتم إرسال طلب شراء إلى البائع. لن يتم تحصيل رسوم منك بعد. يجب على البائع القبول أولاً.",
    failedToSend: "فشل في إرسال طلب الشراء.",
    message: "رسالة {name}"
  }
};

Object.assign(en, newEn);
Object.assign(fr, newFr);
Object.assign(ar, newAr);

// Updating existing Swaps and ExchangeView in en
Object.assign(en.ExchangeView, {
  cancelConfirmTitle: "Cancel this swap?",
  cancelConfirmDesc: "The receiver has already accepted. Cancelling will revert both items to active and notify them.",
  keepSwap: "Keep Swap",
  yesCancel: "Yes, Cancel",
  cancelSwap: "Cancel Swap",
  swapCancelled: "Swap Cancelled",
  swapDeclined: "Swap Declined",
  browseItems: "Browse Items",
  somethingWentWrong: "Something went wrong",
  failedToCancel: "Failed to cancel.",
  statusPending: "Pending",
  statusAccepted: "Accepted",
  statusDeclined: "Declined",
  statusCancelled: "Cancelled"
});

Object.assign(fr.ExchangeView, {
  cancelConfirmTitle: "Annuler ce troc ?",
  cancelConfirmDesc: "Le destinataire a déjà accepté. L'annulation rendra les deux articles actifs et l'en informera.",
  keepSwap: "Garder le troc",
  yesCancel: "Oui, annuler",
  cancelSwap: "Annuler le troc",
  swapCancelled: "Troc annulé",
  swapDeclined: "Troc refusé",
  browseItems: "Parcourir les articles",
  somethingWentWrong: "Une erreur est survenue",
  failedToCancel: "Échec de l'annulation.",
  statusPending: "En attente",
  statusAccepted: "Accepté",
  statusDeclined: "Refusé",
  statusCancelled: "Annulé"
});

Object.assign(ar.ExchangeView, {
  cancelConfirmTitle: "إلغاء هذا التبادل؟",
  cancelConfirmDesc: "لقد وافق المستلم بالفعل. سيؤدي الإلغاء إلى إعادة كلا العنصرين إلى الحالة النشطة وإبلاغهما.",
  keepSwap: "احتفظ بالتبادل",
  yesCancel: "نعم، ألغِ",
  cancelSwap: "إلغاء التبادل",
  swapCancelled: "تم إلغاء التبادل",
  swapDeclined: "تم رفض التبادل",
  browseItems: "تصفح العناصر",
  somethingWentWrong: "حدث خطأ ما",
  failedToCancel: "فشل الإلغاء.",
  statusPending: "قيد الانتظار",
  statusAccepted: "مقبول",
  statusDeclined: "مرفوض",
  statusCancelled: "ملغى"
});

Object.assign(en.Swaps, {
  cancelTransactionConfirm: "This will cancel and remove this transaction. Continue?",
  removeHistoryConfirm: "Remove this from your history?",
  failedToDelete: "Failed to delete: ",
  statusSold: "Sold",
  statusPendingApproval: "Pending Approval"
});

Object.assign(fr.Swaps, {
  cancelTransactionConfirm: "Ceci annulera et supprimera cette transaction. Continuer ?",
  removeHistoryConfirm: "Retirer ceci de votre historique ?",
  failedToDelete: "Échec de la suppression : ",
  statusSold: "Vendu",
  statusPendingApproval: "En attente d'approbation"
});

Object.assign(ar.Swaps, {
  cancelTransactionConfirm: "سيؤدي هذا إلى إلغاء وإزالة هذه المعاملة. استمرار؟",
  removeHistoryConfirm: "إزالة هذا من السجل الخاص بك؟",
  failedToDelete: "فشل في الحذف: ",
  statusSold: "مباع",
  statusPendingApproval: "في انتظار الموافقة"
});

fs.writeFileSync(enFile, JSON.stringify(en, null, 2));
fs.writeFileSync(frFile, JSON.stringify(fr, null, 2));
fs.writeFileSync(arFile, JSON.stringify(ar, null, 2));

console.log("Translation files updated.");
