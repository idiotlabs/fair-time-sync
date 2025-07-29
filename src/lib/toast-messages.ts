// Toast message constants for i18n
export const TOAST_MESSAGES = {
  ko: {
    // Member events
    member_added_success: "멤버가 성공적으로 추가되었습니다.",
    member_added_error: "멤버 추가에 실패했습니다.",
    member_updated_success: "멤버 정보가 업데이트되었습니다.",
    member_updated_error: "멤버 정보 업데이트에 실패했습니다.",
    member_deleted_success: "멤버가 성공적으로 삭제되었습니다.",
    member_deleted_error: "멤버 삭제에 실패했습니다.",
    
    // Rules events
    rules_updated_success: "규칙이 성공적으로 업데이트되었습니다.",
    rules_updated_error: "규칙 업데이트에 실패했습니다.",
    
    // Suggestions events
    suggestions_generated_success: "회의 시간 추천이 생성되었습니다.",
    suggestions_generated_error: "추천 생성에 실패했습니다.",
    suggestions_no_results: "겹치는 시간이 기준에 못 미칩니다. 최소 참석 비율을 낮춰보세요.",
    
    // Export events
    slot_exported_success: "캘린더 파일이 다운로드되었습니다.",
    slot_exported_error: "파일 다운로드에 실패했습니다.",
    
    // Share link events
    share_link_created_success: "공유 링크가 생성되어 클립보드에 복사되었습니다.",
    share_link_created_error: "공유 링크 생성에 실패했습니다.",
    
    // Copy events
    invite_copied_success: "초대 텍스트가 클립보드에 복사되었습니다.",
    invite_copied_error: "복사에 실패했습니다.",
    
    // QA events
    qa_test_success: "테스트 파일이 다운로드되었습니다.",
  },
  en: {
    // Member events
    member_added_success: "Member added successfully.",
    member_added_error: "Failed to add member.",
    member_updated_success: "Member information updated.",
    member_updated_error: "Failed to update member information.",
    member_deleted_success: "Member deleted successfully.",
    member_deleted_error: "Failed to delete member.",
    
    // Rules events
    rules_updated_success: "Rules updated successfully.",
    rules_updated_error: "Failed to update rules.",
    
    // Suggestions events
    suggestions_generated_success: "Meeting time suggestions generated.",
    suggestions_generated_error: "Failed to generate suggestions.",
    suggestions_no_results: "Overlap time does not meet criteria. Try lowering the minimum attendance ratio.",
    
    // Export events
    slot_exported_success: "Calendar file downloaded.",
    slot_exported_error: "Failed to download file.",
    
    // Share link events
    share_link_created_success: "Share link created and copied to clipboard.",
    share_link_created_error: "Failed to create share link.",
    
    // Copy events
    invite_copied_success: "Invite text copied to clipboard.",
    invite_copied_error: "Failed to copy.",
    
    // QA events
    qa_test_success: "Test files downloaded.",
  }
} as const;

export const getToastMessage = (messageKey: keyof typeof TOAST_MESSAGES.ko, locale: string = 'ko') => {
  const messages = TOAST_MESSAGES[locale as keyof typeof TOAST_MESSAGES] || TOAST_MESSAGES.ko;
  return messages[messageKey] || messageKey;
};