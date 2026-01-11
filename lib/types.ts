export type GameResult =
    | "none"
    | "checkmate"
    | "stalemate"
    | "drawByRepetition"
    | "drawByFiftyMoveRule"
    | "drawByInsufficientMaterial"
    | "flag";
