import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#1a73e8",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabButtonText: {
    color: "#1a73e8",
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#e1e4e8",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
    lineHeight: 20,
  },
  itemContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemQuantity: {
    fontSize: 12,
    color: "#666",
  },
  itemPartNumber: {
    fontSize: 12,
    color: "#666",
  },
  totalContainer: {
    marginTop: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
  },
  insuranceContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  insuranceComments: {
    fontSize: 14,
    color: "#333",
    marginTop: 8,
    fontStyle: "italic",
  },
  imagesContainer: {
    padding: 16,
  },
  imageActions: {
    flexDirection: "row",
    marginBottom: 16,
  },
  imageButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  imageButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  imageItem: {
    width: "48%",
    aspectRatio: 1,
    margin: "1%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageDescriptionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
  },
  imageDescription: {
    color: "#fff",
    fontSize: 12,
  },
  emptyImages: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyImagesText: {
    fontSize: 16,
    color: "#999",
    marginBottom: 16,
  },
  commentsContainer: {
    padding: 16,
    flex: 1,
  },
  commentItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  commentDate: {
    fontSize: 12,
    color: "#666",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
  newCommentContainer: {
    flexDirection: "row",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
    paddingTop: 16,
  },
  newCommentInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendCommentButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginLeft: 8,
  },
  sendCommentButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  processesContainer: {
    padding: 16,
  },
  processItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  processHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  processTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  processDate: {
    fontSize: 12,
    color: "#666",
  },
  processDescription: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  emptyProcessesText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
})
